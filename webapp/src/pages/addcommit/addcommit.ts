import { Component, EventEmitter } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { LoginService } from "../../core/login.service";
import { ViewController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";
import { AppConfig } from "../../app.config";
import { UserDetails } from "../../models/user-details.model";
import { LocalStorageService } from "../../core/local-storage.service";
import { BitbucketService, BitbucketApiConstants } from "../../domain/bitbucket.service";
import { FormatUtils } from "../../core/format-utils";
import { UserCommit } from "../../models/user-commit.model";
import { Repository } from "../../models/bitbucket-github/repository.model";
import { BitbucketCommitInfo } from "../../models/bitbucket-github/bitbucket-commit.model";
import { BitbucketRepository } from "../../models/bitbucket-github/bitbucket-repository-response.model";
import { PullRequest, BitbucketPullRequestResponse } from "../../models/bitbucket-github/pull-request.model";
import { GithubService } from "../../domain/github.service";
import { CommitInfo } from "../../models/bitbucket-github/commit-info.model";

@Component({
    selector: "popover-addcommit",
    templateUrl: "addcommit.html"
})
export class AddCommitPopover {

    public readonly BATCH_METHOD = "batch";
    public readonly SEASON_IN_MONTHS = 3;
    public isTxOngoing = false;
    public msg: string;
    public usersMail = new Array<string>();
    public isShowList = new Array<boolean>();
    public mockInputElementList = new Array<any>();
    public arraySearch = new Array<string>();
    public myForm: FormGroup;
    public userAdded = new Array<string>();

    public bitbucketForm: FormGroup;
    public bitbucketUser: string;
    public githubUser: string;
    public bitbucketProjects = new Array<string>();
    public formUrl = "";
    public formTitle = "";
    public currentProject = "";
    public commitMethod = "url";
    public currentSeasonStartDate: Date;
    public hasNewCommits = false;
    public isFinishedLoadingRepo = false;

    public selectedRepositories = new Array<Repository>();
    public repoSelection: string;
    public isBatchLogged = false;
    public isServiceAvailable = true;
    public showSpinner = false;
    public showNextReposOption = false;
    public isUpdatingByBatch = false;
    public updatingProgress = 0;
    public searchInput = "";
    public isRandomReviewers: boolean;

    private readonly MAX_REVIEWERS = AppConfig.MAX_REVIEWER_COUNT;
    private readonly PERCENTAGE_RANGE = 99.99;
    private readonly FACTOR_PERCENTAGE_DECIMALS = 100; 

    private allEmails = new Array<string>();
    private userDetailsProm: Promise<UserDetails>;
    private userAddress: string;
    private userEmail: string;
    private userTeam: number;
    private log: ILogger;
    private loginSubscription: EventEmitter<boolean>;
    private blockChainCommits: Array<string>;
    private nextRepositoriesUrl: Map<string, string>;

    constructor(
        public navCtrl: NavController,
        public viewCtrl: ViewController,
        public http: HttpClient,
        public fb: FormBuilder,
        public translateService: TranslateService,
        private loggerSrv: LoggerService,
        private contractManagerService: ContractManagerService,
        private storageSrv: LocalStorageService,
        private loginService: LoginService,
        private bitbucketSrv: BitbucketService,
        private githubSrv: GithubService
    ) {
        let validator = FormatUtils.getUrlValidatorPattern();
        this.log = this.loggerSrv.get("AddCommitPage");
        this.myForm = this.fb.group({
            url: ["", [Validators.required,
            Validators.pattern(validator)]],
            title: ["", [Validators.required]]
        });


        this.bitbucketForm = this.fb.group({
            username: ["", [Validators.required]],
            password: ["", [Validators.required]]
        });
        this.userAddress = this.loginService.getAccountAddress();
        this.userDetailsProm = this.contractManagerService.getUserDetails(this.userAddress);
        this.contractManagerService.getAllUserReputation(0, true)
            .then(allReputations => {
                this.log.d("All user reputations: ", allReputations);
                this.allEmails = allReputations.map(userRep => userRep.email).sort();
                this.setUpList(this.searchInput);
                if (this.isRandomReviewers) {
                    this.selectRandomReviewers();
                } else{
                    let mailString = this.storageSrv.get(AppConfig.StorageKey.USERMAILS);
                    if (mailString) {
                        let mailArray = mailString.split(";");
                        mailArray.forEach(mail => {
                            this.log.d("Setting email from local Storage: " + mail);
                            this.setEmailFromList(mail);
                        });
                    }
                }
                return this.contractManagerService.getCurrentTeam();
            }).then(userTeam =>  {
                this.log.d("The user team is: ", userTeam);
                this.userTeam = userTeam;
            }).catch((e) => {
                this.showGuiMessage("addCommit.errorEmails", e);
            });
    }

    public ngOnInit() {
        this.log.d("Subscribing to event emitter");
        this.contractManagerService.getRandomReviewer()
        .then((isRandomReviewers: boolean) => {
            this.isRandomReviewers = isRandomReviewers;
            return this.contractManagerService.getUserDetails(this.userAddress);
        }).then((user: UserDetails) => {
            this.userEmail = user.email;
        });
        this.loginSubscription = this.githubSrv.getLoginEmitter()
        .subscribe(res => {
            this.log.d("Provider authentication completed", res);
            this.commitMethod = this.BATCH_METHOD;
            this.githubSrv.getUsername().then((user) => {
                this.isServiceAvailable = true;
                this.githubUser = user.login;
                this.isBatchLogged = true;
                this.loadUserPendingCommitsGithub();
            });
        });
    }

    public ionViewDidLeave() {
        if (this.loginSubscription) {
            this.loginSubscription.unsubscribe();
        }
    }

    public addCommit(url: string, title: string): Promise<void> {
        this.isTxOngoing = true;
        this.clearGuiMessage();
        let errMsgId = null;
        let newCommit: UserCommit;
        return this.userDetailsProm.then(userDetails => {
            let indexUser = this.userAdded.indexOf(this.userEmail);
            if (indexUser > -1) {
                this.userAdded.splice(indexUser, 1);
            }
            for (let userEmail of this.userAdded) {
                if (this.userAdded.indexOf(userEmail) < 0) {
                    errMsgId = "addCommit.unknownEmail";
                }
                if (this.userAdded.reduce((prevCount, mail) => (mail === userEmail ? prevCount + 1 : prevCount), 0) > 1) {
                    errMsgId = "addCommit.emailDuplicated";
                }
                if (userEmail === userDetails.email) {
                    errMsgId = "addCommit.ownEmail";
                }
            }
            let mailArray = this.userAdded.join(";");
            this.storageSrv.set(AppConfig.StorageKey.USERMAILS, mailArray);
            if (this.userAdded.every(userEmail => !userEmail)) {
                errMsgId = "addCommit.emptyInput";
            }
            let ret;
            if (!errMsgId) {
                ret = this.contractManagerService.getCommitDetails(url, false);
            } else {
                ret = Promise.reject({ msg: errMsgId });
            }
            return ret;
        }).catch(e => {
            return Promise.reject((e.msg ? { msg: e.msg, err: e.err } : { msg: "addCommit.commitDetails", err: e }));
        })
            .then(detailsCommits => {
                let ret;
                if (!detailsCommits || !detailsCommits.url) {
                    ret = this.contractManagerService.addCommit(url, title, this.userAdded)
                    .catch(err => {
                        ret = Promise.reject({ msg: "addCommit.errorAddCommit" });
                    });
                } else {
                    ret = Promise.reject({ msg: "addCommit.urlDuplicated" });
                }
                return ret;
            }).then(txResponse => {
                let ret;
                if (txResponse) {
                    this.log.d("Contract manager response: ", txResponse);
                    ret = this.contractManagerService.getCommitDetails(url);
                } else {
                    ret = Promise.reject({ msg: "addCommit.errorResponse" });
                }
                return ret;
            }).then(commit => {
                newCommit = commit;
                return this.contractManagerService.getReviewersName(url);
            }).then((reviewers) => {
                newCommit.reviewers = reviewers;
                this.isTxOngoing = false;
                if (this.commitMethod === "url"){
                    this.viewCtrl.dismiss(newCommit);
                }
            }).catch(e => {
                this.isTxOngoing = false;
                if(e.msg) {
                    this.showGuiMessage(e.msg, e.err);
                }
            });
    }

    public setUpList(word: string) {

        let array;
        array = this.allEmails.filter((item) => {
            if (word) {
                return (item.toLowerCase().indexOf(word.trim().toLowerCase()) > -1);
            } else {
                return item;
            }
        });
        let indexFound = array.indexOf(this.userEmail);
        if (indexFound > -1) {
            array.splice(indexFound, 1);
        }
        for (let email of this.userAdded) {
            array.find((value, index) => {
                if (value === email) {
                    array.splice(index, 1);
                }
            });
        }
        this.arraySearch = array;
    }

    public selectRandomReviewers() {
        let indexFound = this.allEmails.indexOf(this.userEmail);
        if (indexFound > -1) {
            this.allEmails.splice(indexFound, 1);
        }
        if (this.allEmails.length <= this.MAX_REVIEWERS) {
            this.userAdded = this.allEmails;
        } else {
            let randomUserEmail: string;
            while (this.userAdded.length < this.MAX_REVIEWERS) {
                randomUserEmail = this.allEmails[Math.floor(Math.random() * (this.allEmails.length))];
                if(this.userAdded.indexOf(randomUserEmail) < 0) {
                    this.userAdded.push(randomUserEmail);
                }
            }  
        }   
    }

    public refreshSearchbar() {
        this.setUpList(this.searchInput);
    }
    
    public setEmailFromList(item: string) {
        let isDuplicated = false;

        if (this.userAdded.length < this.MAX_REVIEWERS) {
            this.userDetailsProm.then((userDetails: UserDetails) => {
                if (item === userDetails.email) {
                    this.showGuiMessage("addCommit.ownEmail");
                    isDuplicated = true;
                }
                isDuplicated = isDuplicated || (this.usersMail.indexOf(item) >= 0);
                if (isDuplicated) {
                    this.showGuiMessage("addCommit.emailDuplicated");
                } else {
                    this.userAdded.push(item);
                    this.arraySearch.splice(this.arraySearch.indexOf(item), 1);
                }

            });
        }
    }

    public removeUser(idx: number) {
        this.userAdded.splice(idx, 1);
        this.setUpList(this.searchInput);
    }

    public setUploadMethodAndProceed(method: string) {
        this.commitMethod = method;
        this.clearGuiMessage();
        if (this.commitMethod === this.BATCH_METHOD) {
            this.loginToGithub();
        }
    }

    public addRepoStartingFrom(repoSelection: string, commitIndex = 0, prIndex = 0, updatedProgress = 0) {
        let errMsgId: string;
        if (this.userAdded.every(userEmail => !userEmail)) {
            errMsgId = "addCommit.emptyInput";
        }
        if (!errMsgId) {
            this.updatingProgress = updatedProgress;
            this.isUpdatingByBatch = true;
            this.selectedRepositories.forEach((repo) => {
                if (repo != null && repoSelection === repo.name) {
                    let percentage = Math.floor(this.PERCENTAGE_RANGE * this.FACTOR_PERCENTAGE_DECIMALS / (repo.numCommits + repo.numPrs)) 
                                    / this.FACTOR_PERCENTAGE_DECIMALS;
                    repo.commitsInfo.slice(commitIndex).reduce(
                        (prevVal, commit) => {
                            return prevVal.then(() => {
                                this.updatingProgress += percentage;
                                let comUrl = BitbucketApiConstants.BASE_URL + repo.workspace + "/"
                                    + repoSelection.toLowerCase() + "/commits/" + commit.hash;
                                commitIndex++;
                                return this.addCommit(comUrl, commit.name);
                            });
                        },
                        Promise.resolve()
                    ).then(() => {
                        return repo.pullRequestsNotUploaded.slice(prIndex).reduce(
                            (prevVal, pullrequest) => {
                                return prevVal.then(() => {
                                    this.updatingProgress += percentage;
                                    let prUrl = BitbucketApiConstants.BASE_URL + repo.workspace + "/"
                                        + repoSelection.toLowerCase() + "/pull-requests/" + pullrequest.id;
                                    prIndex++;
                                    return this.addCommit(prUrl, pullrequest.title);
                                });
                            },
                            Promise.resolve()
                        );
                    }).then(() => {
                        this.isUpdatingByBatch = false;
                        this.viewCtrl.dismiss();
                    }).catch(err => {
                        if (commitIndex < repo.commitsInfo.length || prIndex < repo.pullRequestsNotUploaded.length) {
                            this.addRepoStartingFrom(repoSelection, commitIndex, prIndex, this.updatingProgress);
                        } else {
                            this.isUpdatingByBatch = false;
                            if(!(err.msg)) {
                                throw err;
                            } else {
                                this.showGuiMessage("addCommit.errorAddCommit"); 
                            }
                        }
                    });
                }
            });
        } else {
            this.showGuiMessage(errMsgId);
        }
    }

    public loadNextRepos(): Promise<void>{
        this.showSpinner = true;
        return this.bitbucketSrv.getTeamBackendConfig(this.userTeam, this.userAddress).then(config => {
            return config.bitbucketWorkspaces;
        }).then(workspaces => {
            let promisesWorkspaces = workspaces.map(workspace => {
                if (this.nextRepositoriesUrl.has(workspace) && this.nextRepositoriesUrl.get(workspace)) {
                    return this.bitbucketSrv.getNextRepositories(this.nextRepositoriesUrl.get(workspace)).then(repositories => {
                        let promisesRepos = repositories.values.map(repository => {
                            return this.handleRepository(workspace, repository);
                        });
                        return Promise.all(promisesRepos).then(() => {
                            this.nextRepositoriesUrl.set(workspace, repositories.next);
                        });
                    });
                }
                return null;
            });
            return Promise.all(promisesWorkspaces).then(() => {
                this.showSpinner = false;
                this.showNextReposOption = workspaces.some(workspace => {
                    return this.nextRepositoriesUrl.has(workspace) && this.nextRepositoriesUrl.get(workspace) ? true : false;
                });
            });
        });
    }

    private readonly SORT_BY_DATE_FN = (comA, comB) => comA.date - comB.date;

    private loadUserPendingCommitsGithub(): Promise<void> {
        this.selectedRepositories = new Array<Repository>();
        this.blockChainCommits = new Array<string>();
        this.nextRepositoriesUrl = new Map<string, string>();
        let seasonDate;
        let seasonLengthIndays;
        this.isFinishedLoadingRepo = false;
        this.showNextReposOption = false;
        return this.contractManagerService.getCurrentSeason().then((seasonEndDate) => {
            let dateNowSecs = Date.now() / AppConfig.SECS_TO_MS;
            seasonLengthIndays = seasonEndDate[2] / AppConfig.DAY_TO_SECS;
            seasonDate = seasonEndDate[1] < dateNowSecs ? 
                new Date((seasonEndDate[1] + seasonEndDate[2]) * AppConfig.SECS_TO_MS) : new Date(seasonEndDate[1] * AppConfig.SECS_TO_MS);
            return seasonDate;
        }).then(() => {
            this.showSpinner = true;
            return this.contractManagerService.getCommits();
        }).then(commits => {
            commits = commits.filter(com => com);    
            this.blockChainCommits = commits.map(com => {
                return com.url.indexOf("pull-requests") >= 0 ? com.url : com.urlHash;
            });
            this.log.d("The commits from the blockchain", this.blockChainCommits);
            seasonDate.setDate(seasonDate.getDate() - seasonLengthIndays);
            this.currentSeasonStartDate = seasonDate;
            return this.githubSrv.getRepositoriesOrg(this.currentSeasonStartDate);
        }).then((repositories: Array<Repository>) => {
            this.log.d("The repositories from Github are: ", repositories);
            repositories = repositories.filter(repo => repo.commitsInfo.length > 0);
            repositories.forEach((repo) => (repo.commitsInfo = repo.commitsInfo.filter (
                commit => this.blockChainCommits.indexOf(commit.hash) < 0 ), 
                this.selectedRepositories.push(repo), 
                repo.numCommits = repo.commitsInfo.length));
            return repositories;
        }).then(() => {
            this.showSpinner = false;
            this.isFinishedLoadingRepo = true;
            this.log.d("All the commits from the respos", this.selectedRepositories);
        }).catch(err => { 
            this.showSpinner = false;
            this.isServiceAvailable = false;
            this.isBatchLogged = false;
            this.log.e("Error loading commits and PRs: " + err); 
        });
    }

    private showGuiMessage(txtId, e?: any) {
        this.translateService.get(txtId)
            .subscribe(msg => {
                this.msg = msg;
                if (e) {
                    this.log.e(msg, e);
                }
            });
    }

    private clearGuiMessage() {
        this.msg = "";
    }

    private loginToGithub() {
        this.userAddress = this.loginService.getAccountAddress();
        this.commitMethod = this.BATCH_METHOD;
        this.log.d("The user is going to login with Github provider");
        this.githubSrv.checkProviderAvailability(this.userAddress, this.userTeam).then(user => {
            this.log.d("Waiting for the user to introduce their credentials");
            this.isServiceAvailable = true;
        }).catch(e => {
            this.log.w("Service not available", e);
            this.isServiceAvailable = false;
        });
    }

    private handleRepository(workspace: string, repository: BitbucketRepository): Promise<void> {
        let repo: Repository = new Repository(repository.slug, repository.name, workspace);
        return this.bitbucketSrv.getPullRequests(workspace, repo.slug).then(pr => {
            return this.processProviderPullRequests(workspace, repo, pr);
        }).then(nextUrl => {
            return this.getNextPullrequests(workspace, repo, nextUrl);
        }).then(() => {
            return this.bitbucketSrv.getReposlug(workspace, repo.slug);
        }).then(async commits => {
            let prCommits = new Array<string>();
            repo.pullRequests.forEach(pr => {
                prCommits = prCommits.concat(pr.commitsHash);
            });

            repo = this.manageProviderCommits(repo, commits.values, prCommits);
            let nextCommits = commits.next;
            if (nextCommits == null && (repo.numCommits > 0 || repo.numPrsNotUploaded > 0)) {
                this.hasNewCommits = true;
                repo.commitsInfo.sort(this.SORT_BY_DATE_FN);
                repo.pullRequestsNotUploaded.sort(this.SORT_BY_DATE_FN);
                this.selectedRepositories.push(repo);
            }

            if (nextCommits) {
                repo = await this.getNextPages(repo, nextCommits, prCommits);
            }
            return Promise.resolve();
        });
    }

    private processProviderPullRequests(workspace: string, repo: Repository,
                                        pullrequestsResponse: BitbucketPullRequestResponse): Promise<string> {
        let promises = pullrequestsResponse.values.map(async pullrequest => {
            let prDate = new Date(pullrequest.updated_on);
            let pr = new PullRequest(pullrequest.id, pullrequest.title, pullrequest.author, prDate, pullrequest.destination.commit.hash);

            if (prDate < this.currentSeasonStartDate) {
                pullrequestsResponse.next = null;
            }

            if (pullrequest.author.uuid === this.bitbucketUser && prDate >= this.currentSeasonStartDate) {
                const prCommits = await this.bitbucketSrv.getPrCommits(pullrequest.links.commits.href);
                pr.commitsHash = prCommits.values.map(com => com.hash);
                let nextUrl = prCommits.next;

                while (nextUrl) {
                    let nextPrCommits = await this.bitbucketSrv.getNextReposlug(nextUrl);
                    let filtedHashes = nextPrCommits.values.map(com => com.hash);
                    pr.commitsHash = pr.commitsHash.concat(filtedHashes);
                    nextUrl = nextPrCommits.next;
                }

                repo.numPrs = repo.pullRequests.push(pr);
                let partialUrl = BitbucketApiConstants.BASE_URL + workspace + "/" + repo.slug + "/pull-requests/" + pullrequest.id;
                if (this.blockChainCommits.indexOf(partialUrl) < 0) {
                        repo.numPrsNotUploaded = repo.pullRequestsNotUploaded.push(pr);
                }
            }
        });

        return Promise.all(promises).then(() => {
            return pullrequestsResponse.next;
        });
    }

    private async getNextPullrequests(workspace: string, repository: Repository, nextCommitsUrl: string): Promise<void> {
        let auxUrl = nextCommitsUrl;
        while (auxUrl) {
            let nextPr = await this.bitbucketSrv.getNextPullrequest(auxUrl);
            await this.processProviderPullRequests(workspace, repository, nextPr);
            auxUrl = nextPr.next;
        }
    }

    private manageProviderCommits(repo: Repository, commits: Array<BitbucketCommitInfo>, prCommits: Array<string>): Repository {
        commits.forEach(commit => {
            let comDate = new Date(commit.date);
            if (comDate < this.currentSeasonStartDate) {
                repo.isReadAllCommits = true;
            }

            if (commit.author.user && commit.author.user.uuid === this.bitbucketUser
                && comDate >= this.currentSeasonStartDate && this.blockChainCommits.indexOf(commit.hash) < 0
                && prCommits.indexOf(commit.hash) < 0 && commit.parents.length < 2) {
                let commitInfo = new CommitInfo(commit.hash, commit.message.split("\n")[0], comDate);
                repo.numCommits = repo.commitsInfo.push(commitInfo);
            }
        });
        return repo;
    }

    private async getNextPages(repository: Repository, nextCommitsUrl: string,
                               prCommits: Array<string>): Promise<Repository> {
        let auxUrl = nextCommitsUrl;
        while (auxUrl) {
            let nextCommits = await this.bitbucketSrv.getNextReposlug(auxUrl);
            repository = this.manageProviderCommits(repository, nextCommits.values, prCommits);
            auxUrl = repository.isReadAllCommits ? null : nextCommits.next;
            if (auxUrl == null && (repository.numCommits > 0 || repository.numPrsNotUploaded > 0)) {
                this.hasNewCommits = true;
                
                repository.commitsInfo.sort(this.SORT_BY_DATE_FN);
                repository.pullRequestsNotUploaded.sort(this.SORT_BY_DATE_FN);
                this.selectedRepositories.push(repository);
            } else if (auxUrl) {
                auxUrl = nextCommits.next;
            }
        }
        return repository;
    }
}
