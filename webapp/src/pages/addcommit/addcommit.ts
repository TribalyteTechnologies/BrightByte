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
import { Repository } from "../../models/bitbucket/repository.model";
import { CommitInfo, BitbucketCommitInfo } from "../../models/bitbucket/commit-info.model";
import { BitbucketRepository } from "../../models/bitbucket/repository.model";
import { PullRequest, BitbucketPullRequestResponse } from "../../models/bitbucket/pull-request.model";
import { BackendConfig } from "../../models/backend-config.model";

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
    public arraySearch: string[];
    public myForm: FormGroup;
    public userAdded = new Array<string>();

    public bitbucketForm: FormGroup;
    public bitbucketUser: string;
    public bitbucketProjects: Array<string> = [];
    public commitList = [];
    public formUrl = "";
    public formTitle = "";
    public currentProject = "";
    public commitMethod = "url";
    public currentSeasonStartDate: Date;
    public hasNewCommits = false;
    public isFinishedLoadingRepo = false;

    public selectedRepositories = new Array<Repository>();
    public repoSelection: String;
    public isBatchLogged = false;
    public isServiceAvailable = true;
    public showSpinner = false;
    public isUpdatingByBatch = false;
    public updatingProgress: number = 0;
    public sortByDate: any;

    private allEmails = new Array<string>();
    private searchInput = "";
    private readonly MAX_REVIEWERS = AppConfig.MAX_REVIEWER_COUNT;
    private userDetailsProm: Promise<UserDetails>;
    private log: ILogger;
    private loginSubscription: EventEmitter<boolean>;

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
        private bitbucketSrv: BitbucketService
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
        let userAddress = this.loginService.getAccountAddress();
        this.userDetailsProm = this.contractManagerService.getUserDetails(userAddress);
        this.contractManagerService.getAllUserReputation(0, true)
            .then(allReputations => {
                this.log.d("All user reputations: ", allReputations);
                this.allEmails = allReputations.map(userRep => userRep.email).sort();
                this.setUpList(this.searchInput);
                let mailString = this.storageSrv.get(AppConfig.StorageKey.USERMAILS);
                if (mailString) {
                    let mailArray = mailString.split(";");
                    mailArray.forEach(mail => {
                        this.log.d("Setting email from local Storage: " + mail);
                        this.setEmailFromList(mail);
                    });
                }
            }).catch((e) => {
                this.showGuiMessage("addCommit.errorEmails", e);
            });
    }

    public ngOnInit() {
        this.log.d("Subscribing to event emitter");
        this.loginSubscription = this.bitbucketSrv.getLoginEmitter()
        .subscribe(res => {
            this.log.d("Provider authentication completed", res);
            this.commitMethod = this.BATCH_METHOD;
            this.sortByDate = (comA, comB) => (comA.date >= comB.date) ? 1 : -1;
            this.bitbucketSrv.getUsername().then((user) => {
                this.isServiceAvailable = true;
                this.bitbucketUser = user;
                this.isBatchLogged = true;
                this.loadUserPendingCommitsAndPr();
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
                        Promise.reject({ msg: "addCommit.addingCommit", err: err });
                        throw err;
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
                this.showGuiMessage(e.msg, e.err);
                this.isTxOngoing = false;
                throw e;
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
        this.userDetailsProm.then((userDetails: UserDetails) => {
            array.find((value, index) => {
                if (value === userDetails.email) {
                    array.splice(index, 1);
                }
            });
        });
        for (let email of this.userAdded) {
            array.find((value, index) => {
                if (value === email) {
                    array.splice(index, 1);
                }
            });
        }
        this.arraySearch = array;
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
        if (this.commitMethod === this.BATCH_METHOD) {
            this.loginToBitbucket();
        }
    }

    public loadUserPendingCommitsAndPr(): Promise<void> {
        this.selectedRepositories = new Array<Repository>();
        let blockChainCommits = new Array<string>();
        let seasonDate;
        return this.contractManagerService.getCurrentSeason().then((seasonEndDate) => {
            this.isFinishedLoadingRepo = false;
            seasonDate = new Date(1000 * seasonEndDate[1]);
            return seasonDate;
        }).then(() => {
            this.showSpinner = true;
            return this.contractManagerService.getCommits();
        }).then(commits => {           
            blockChainCommits = commits.map(com => {
                return com.url.indexOf("pull-requests") >= 0 ? com.url : com.urlHash;
            });
            this.log.d("The commits from the blockchain", blockChainCommits);
            return this.bitbucketSrv.getBackendConfig();
        }).then((config: BackendConfig) => {
            seasonDate.setMonth(seasonDate.getMonth() - config.season.durationInMonths);
            this.currentSeasonStartDate = seasonDate;
            let workspaces = config.bitbucket.workspaces;
            let promisesWorkspaces = workspaces.map(workspace => {
                return this.bitbucketSrv.getRepositories(workspace, this.currentSeasonStartDate).then(repositories => {
                    this.log.d("The repositories from Bitbucket are: ", repositories);
                    let promisesRepos = repositories.map(repository => {
                        return this.handleRepository(workspace, repository, blockChainCommits);
                    });
                    return Promise.all(promisesRepos);    
                });
            });
            return Promise.all(promisesWorkspaces);
        }).then(() => {
            this.showSpinner = false;
            this.isFinishedLoadingRepo = true;
            this.log.d("All the commits from the respos", this.selectedRepositories);
            return Promise.resolve();
        }).catch(err => { throw err; });
    }

    public addRepo(repoSelection: string) {
        this.updatingProgress = 0;
        this.isUpdatingByBatch = true;
        this.selectedRepositories.forEach((repo) => {
            if (repo != null && repoSelection === repo.name) {
                let percentage = Math.floor(10000 / (repo.numCommits + repo.numPrs)) / 100;
                repo.commitsInfo.reduce(
                    (prevVal, commit) => {
                        return prevVal.then(() => {
                            this.updatingProgress += percentage;
                            let comUrl = BitbucketApiConstants.BASE_URL + repo.workspace + "/"
                                + repoSelection.toLowerCase() + "/commits/" + commit.hash;
                            return this.addCommit(comUrl, commit.name);
                        });
                    },
                    Promise.resolve()
                ).then(() => {
                    return repo.pullRequestsNotUploaded.reduce(
                        (prevVal, pullrequest) => {
                            return prevVal.then(() => {
                                this.updatingProgress += percentage;
                                let prUrl = BitbucketApiConstants.BASE_URL + repo.workspace + "/"
                                    + repoSelection.toLowerCase() + "/pull-requests/" + pullrequest.id;
                                return this.addCommit(prUrl, pullrequest.title);
                            });
                        },
                        Promise.resolve()
                    );
                }).then(() => {
                    this.isUpdatingByBatch = false;
                    this.viewCtrl.dismiss();
                });
            }
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

    private loginToBitbucket() {
        let userAddress = this.loginService.getAccountAddress();
        this.commitMethod = this.BATCH_METHOD;
        this.bitbucketSrv.checkProviderAvailability(userAddress).then(user => {
            this.log.d("Waiting for the user to introduce their credentials");
        }).catch(e => {
            this.log.w("Service not available", e);
            this.isServiceAvailable = false;
        });
    }

    private handleRepository(workspace: string, repository: BitbucketRepository, blockChainCommits: Array<string>): Promise<void> {
        let repo: Repository = new Repository(repository.slug, repository.name, workspace);
        return this.bitbucketSrv.getPullRequests(workspace, repo.slug).then(pr => {
            return this.processProviderPullRequests(workspace, repo, pr, blockChainCommits);
        }).then(nextUrl => {
            return this.getNextPullrequests(workspace, repo, nextUrl, blockChainCommits);
        }).then(() => {
            return this.bitbucketSrv.getReposlug(workspace, repo.slug);
        }).then(async commits => {
            let prCommits = new Array<string>();
            repo.pullRequests.forEach(pr => {
                prCommits = prCommits.concat(pr.commitsHash);
            });

            repo = this.manageProviderCommits(repo, commits.values, blockChainCommits, prCommits);
            let nextCommits = commits.next;
            if (nextCommits == null && (repo.numCommits > 0 || repo.numPrsNotUploaded > 0)) {
                this.hasNewCommits = true;
                repo.commitsInfo.sort(this.sortByDate);
                repo.pullRequestsNotUploaded.sort(this.sortByDate);
                this.selectedRepositories.push(repo);
            }

            if (nextCommits && (repo.numCommits > 0 || repo.numPrsNotUploaded > 0)) {
                repo = await this.getNextPages(repo, nextCommits, blockChainCommits, prCommits);
            }
            return Promise.resolve();
        });
    }  

    private processProviderPullRequests(workspace: string, repo: Repository, pullrequestsResponse: BitbucketPullRequestResponse,
                                        blockChainCommits: Array<string>): Promise<string> {
        let promises = pullrequestsResponse.values.map(async pullrequest => {
            let prDate = new Date(pullrequest.updated_on);
            let pr = new PullRequest(pullrequest.id, pullrequest.title, pullrequest.author, prDate, pullrequest.destination.commit.hash);
            if (pullrequest.author.nickname === this.bitbucketUser && prDate >= this.currentSeasonStartDate) {
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
                if (blockChainCommits.indexOf(partialUrl) < 0) {
                        repo.numPrsNotUploaded = repo.pullRequestsNotUploaded.push(pr);
                }
            }
        });

        return Promise.all(promises).then(() => {
            return pullrequestsResponse.next;
        });
    }

    private async getNextPullrequests(workspace: string, repository: Repository, nextCommitsUrl: string,
                                      blockChainCommits: Array<string>): Promise<void> {
        let auxUrl = nextCommitsUrl;
        while (auxUrl) {
            let nextPr = await this.bitbucketSrv.getNextPullrequest(auxUrl);
            await this.processProviderPullRequests(workspace, repository, nextPr, blockChainCommits);
            auxUrl = nextPr.next;
        }
    }

    private manageProviderCommits(repo: Repository, commits: Array<BitbucketCommitInfo>, blockChainCommits: Array<string>,
                                  prCommits: Array<string>): Repository {
        commits.forEach(commit => {
            let comDate = new Date(commit.date);
            if (comDate < this.currentSeasonStartDate) {
                repo.isReadAllCommits = true;
            }
            if (commit.author.user && commit.author.user.nickname === this.bitbucketUser
                && comDate >= this.currentSeasonStartDate && blockChainCommits.indexOf(commit.hash) < 0
                && prCommits.indexOf(commit.hash) < 0 && commit.parents.length < 2) {
                let commitInfo = new CommitInfo(commit.hash, commit.message, comDate);
                repo.numCommits = repo.commitsInfo.push(commitInfo);
            }
        });
        return repo;
    }

    private async getNextPages(repository: Repository, nextCommitsUrl: string, blockChainCommits: Array<string>,
                               prCommits: Array<string>): Promise<Repository> {
        let auxUrl = nextCommitsUrl;
        while (auxUrl) {
            let nextCommits = await this.bitbucketSrv.getNextReposlug(auxUrl);
            repository = this.manageProviderCommits(repository, nextCommits.values, blockChainCommits, prCommits);
            auxUrl = repository.isReadAllCommits ? null : nextCommits.next;
            if (auxUrl == null && (repository.numCommits > 0 || repository.numPrsNotUploaded > 0)) {
                this.hasNewCommits = true;
                
                repository.commitsInfo.sort(this.sortByDate);
                repository.pullRequestsNotUploaded.sort(this.sortByDate);
                this.selectedRepositories.push(repository);
            } else if (auxUrl) {
                auxUrl = nextCommits.next;
            }
        }
        return repository;
    }
}
