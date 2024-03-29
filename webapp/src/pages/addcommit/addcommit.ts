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
import { GithubApiConstants, GithubService } from "../../domain/github.service";
import { CommitInfo } from "../../models/bitbucket-github/commit-info.model";
import { BackendBitbucketConfig } from "../../models/backend-bitbucket-config.model";
import { BackendGithubConfig } from "../../models/backend-github-config.model";
import { TeamMember } from "../../models/team-member.model";

@Component({
    selector: "popover-addcommit",
    templateUrl: "addcommit.html"
})
export class AddCommitPopover {

    public readonly BATCH_METHOD = "batch";
    public isTxOngoing = false;
    public msg: string;
    public usersMail = new Array<string>();
    public arraySearch = new Array<string>();
    public myForm: FormGroup;
    public userAdded = new Array<string>();
    public areProvidersWorking: boolean;
    public isReady: boolean;
    public areProvidersDefined: boolean;
    public isServiceAvailable: boolean;
    public isBatchLogged: boolean;
    public showSpinner: boolean;
    public isRandomReviewers: boolean;
    public showNextReposOption: boolean;
    public isUpdatingByBatch: boolean;
    
    public formUrl: string;
    public formTitle: string;
    public commitMethod = "url";
    public isoStartDate: string;
    public hasNewCommits: boolean;
    public isFinishedLoadingRepo: boolean;
    public updatingProgress = 0;
    public searchInput: string;
    public selectedRepositories = new Array<Repository>();
    public repoSelection: Repository;

    private readonly MAX_REVIEWERS = AppConfig.MAX_REVIEWER_COUNT;
    private readonly PERCENTAGE_RANGE = 99.99;
    private readonly FACTOR_PERCENTAGE_DECIMALS = 100; 
    private readonly BITBUCKET_PROVIDER = "Bitbucket";
    private readonly GITHUB_PROVIDER = "GitHub";

    private allEmails = new Array<string>();
    private userDetailsProm: Promise<UserDetails>;
    private userAddress: string;
    private currentVersion: number;
    private userEmail: string;
    private userTeam: number;
    private log: ILogger;
    private githubLoginSubscription: EventEmitter<boolean>;
    private bitbucketLoginSubscription: EventEmitter<boolean>;
    private blockChainCommits: Array<string>;
    private nextRepositoriesUrl: Map<string, string>;
    private seasonDate: Date;
    private seasonLengthIndays: number;
    private isWorkspaceCorrect: boolean;
    private isOrganizationCorrect: boolean;
    private isWorkspaceDefined: boolean;
    private isOrganizationDefined: boolean;
    private isGithubServiceAvailable: boolean;
    private isBitbuckerServiceAvailable: boolean;
    private bitbucketUser: string;
    private currentSeasonStartDate: Date;


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

        this.userAddress = this.loginService.getAccountAddress();
        this.userDetailsProm = this.contractManagerService.getUserDetails(this.userAddress);
    }

    public ngOnInit() {
        this.isWorkspaceCorrect = true;
        this.isOrganizationCorrect = true;
        this.areProvidersWorking = true;
        this.areProvidersDefined = true;
        this.isReady = false;
        this.showSpinner = true;
        this.init().then(() => {
            this.showSpinner = false;
            this.log.d("Subscribing to event emitter");
            this.isReady = true;
            this.bitbucketLoginSubscription = this.bitbucketSrv.getLoginEmitter()
            .subscribe(res => {
                this.log.d("Provider authentication completed", res);
                this.bitbucketSrv.getUsername().then((user) => {
                    this.bitbucketUser = user;
                    return this.loadUserPendingCommitsAndPrs();
                });
            });
            this.githubLoginSubscription = this.githubSrv.getLoginEmitter()
            .subscribe(res => {
                this.log.d("Provider authentication completed", res);
                this.githubSrv.getUsername().then((user) => {
                    return this.loadUserPendingCommitsGithub();
                });
            });
        });
    }

    public ionViewDidLeave() {
        if (this.bitbucketLoginSubscription) {
            this.bitbucketLoginSubscription.unsubscribe();
        }
        if (this.githubLoginSubscription) {
            this.githubLoginSubscription.unsubscribe();
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
            this.setBatch();
            this.showSpinner = true;
            this.isOrganizationCorrect = true;
            this.isWorkspaceCorrect = true;
            this.isBitbuckerServiceAvailable = true;
            this.areProvidersDefined = true;
            this.isGithubServiceAvailable = true;
            this.selectedRepositories = new Array<Repository>();
            this.isServiceAvailable = true;
            this.loadBatchConfig().then(() => {
                return Promise.all([this.tryLoginBitbucket(), this.tryLoginGithub()]);
            }).then(() => {
                this.areProvidersDefined = this.isOrganizationDefined || this.isWorkspaceDefined;
                this.isServiceAvailable = this.isBitbuckerServiceAvailable || this.isGithubServiceAvailable;
                this.showSpinner = this.areProvidersDefined && this.isServiceAvailable;
                this.log.d("Batch upload set");
            });
        }
    }

    public addRepoStartingFrom(repoSelection: Repository, commitIndex = 0, prIndex = 0, updatedProgress = 0) {
        this.log.d("The selected repo is", repoSelection);
        let errMsgId: string;
        if (this.userAdded.every(userEmail => !userEmail)) {
            errMsgId = "addCommit.emptyInput";
        }
        if (!errMsgId) {
            this.updatingProgress = updatedProgress;
            this.isUpdatingByBatch = true;
            let repoName = repoSelection.name;
            const repoNameLowerCase = repoName.toLowerCase();
            let repoProvider = repoSelection.provider;
            this.selectedRepositories.forEach((repo) => {
                if (repo != null && repoName === repo.name && repoProvider === repo.provider) {
                    let percentage = Math.floor(this.PERCENTAGE_RANGE * this.FACTOR_PERCENTAGE_DECIMALS / (repo.numCommits + repo.numPrs)) 
                                    / this.FACTOR_PERCENTAGE_DECIMALS;
                    repo.commitsInfo.slice(commitIndex).reduce(
                        (prevVal, commit) => {
                            return prevVal.then(() => {
                                this.updatingProgress += percentage;
                                let comUrl = (repo.provider === this.BITBUCKET_PROVIDER) ? 
                                (BitbucketApiConstants.BASE_URL + repo.workspace + "/" + repoNameLowerCase + "/commits/") : 
                                GithubApiConstants.BASE_URL + repo.organization + "/" + repoNameLowerCase + "/commit/";
                                comUrl += commit.hash;    
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
                                    let prUrl = (repo.provider === this.BITBUCKET_PROVIDER) ? 
                                    BitbucketApiConstants.BASE_URL + repo.workspace : 
                                    GithubApiConstants.BASE_URL + repo.organization;
                                    prUrl += "/" + repoNameLowerCase + "/pull-requests/" + pullrequest.id;
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
        return this.bitbucketSrv.getTeamBackendConfig(this.userTeam, this.userAddress, this.currentVersion)
        .then(config => {
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

    public loadUserPendingCommitsAndPrs(): Promise<void> {
        this.showSpinner = true;
        return this.bitbucketSrv.getTeamBackendConfig(this.userTeam, this.userAddress, this.currentVersion)
        .then((config: BackendBitbucketConfig) => {
            let workspaces = config.bitbucketWorkspaces;
            let promisesWorkspaces = workspaces.map(workspace => {
                return this.bitbucketSrv.getRepositories(workspace, this.currentSeasonStartDate).then(repositories => {
                    this.log.d("The repositories from Bitbucket are: ", repositories);
                    let promisesRepos = repositories.values.map(repository => {
                        return this.handleRepository(workspace, repository);
                    });
                    return Promise.all(promisesRepos).then(() => {
                        this.nextRepositoriesUrl.set(workspace, repositories.next);
                    });   
                });
            });
            return Promise.all(promisesWorkspaces).then(() => {
                this.showNextReposOption = workspaces.some(workspace => {
                    return this.nextRepositoriesUrl.has(workspace) && this.nextRepositoriesUrl.get(workspace) ? true : false;
                });
            });
        }).then(() => {
            this.showSpinner = false;
            this.isFinishedLoadingRepo = true;
            this.log.d("All the commits from the respos", this.selectedRepositories);
        }).catch(err => { 
            this.isWorkspaceCorrect = false;
            this.areProvidersWorking = this.isOrganizationCorrect || this.isWorkspaceCorrect;
            this.showSpinner = this.areProvidersWorking;
            this.log.w("Error loading commits and PRs: " + err); 
        });
    }

    private readonly SORT_BY_DATE_FN = (comA, comB) => comA.date - comB.date;

    private loadUserPendingCommitsGithub(): Promise<void> {
        this.isOrganizationCorrect = true;
        return this.githubSrv.getTeamBackendConfig(this.userTeam, this.userAddress, this.currentVersion)
        .then((config: BackendGithubConfig) => {
            let organizations = config.githubOrganizations;
            let promises = organizations.map(organization => this.githubSrv.getRepositoriesOrg(this.currentSeasonStartDate, organization));
            return Promise.all(promises);
        }).then((organizations: Array<Array<Repository>>) => {
            let repositories = organizations.map((orgRepositories: Array<Repository>) => {
                return orgRepositories.filter(repo => {
                    repo.commitsInfo = repo.commitsInfo.filter(commit =>
                        this.blockChainCommits.indexOf(commit.hash) < 0
                    );
                    repo.provider = this.GITHUB_PROVIDER, 
                    repo.numCommits = repo.commitsInfo.length;
                    return repo.numCommits > 0;
                });
            });
            this.log.d("The repositories from Github are: ", repositories);
            repositories.forEach(orgRepositories => orgRepositories.forEach(repo => this.selectedRepositories.push(repo)));
            this.hasNewCommits = repositories.length > 0;
            this.isFinishedLoadingRepo = true;
            this.log.d("All the commits from the repos", this.selectedRepositories);
        }).catch(err => { 
            this.isOrganizationCorrect = false;
            this.areProvidersWorking = this.isOrganizationCorrect || this.isWorkspaceCorrect;
            this.showSpinner = this.areProvidersWorking;
            this.log.e("Error loading commits from provider (Github): " + err); 
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


    private tryLoginBitbucket(): Promise<void> {
        this.userAddress = this.loginService.getAccountAddress();
        this.currentVersion = this.loginService.getCurrentVersion();
        this.log.d("The user is going to login with Bitbucket provider");
        this.isWorkspaceDefined = false;
        this.isBitbuckerServiceAvailable = true;
        return this.bitbucketSrv.getTeamBackendConfig(this.userTeam, this.userAddress, this.currentVersion)
        .then((config: BackendBitbucketConfig) => {
            const workspaces = config.bitbucketWorkspaces;
            this.isWorkspaceDefined = workspaces.length > 0;
            let promise = this.isWorkspaceDefined ? 
                this.bitbucketSrv.checkProviderAvailability(this.userAddress, this.userTeam, this.currentVersion) :
                Promise.reject("No Bitbucket workspaces available");
            return promise;
        }).then(isServiceAvailable => {
            this.isBitbuckerServiceAvailable = isServiceAvailable;
            this.log.d("Waiting for the user to introduce their bitbucket credentials");
        }).catch(e => {
            this.log.w("Ignoring error: ", e);
        });
    }

    private tryLoginGithub(): Promise<void> {
        this.userAddress = this.loginService.getAccountAddress();
        this.currentVersion = this.loginService.getCurrentVersion();
        this.log.d("The user is going to login with Github provider");
        this.isOrganizationDefined = false;
        this.isGithubServiceAvailable = true;
        return this.githubSrv.getTeamBackendConfig(this.userTeam, this.userAddress, this.currentVersion)
        .then((config: BackendGithubConfig) => {
            let organizations = config.githubOrganizations;
            this.isOrganizationDefined = organizations.length > 0;
            let promise = organizations.length > 0 ? 
                this.githubSrv.checkProviderAvailability(this.userAddress, this.userTeam, this.currentVersion) :
                Promise.reject("No github organizations available");
            return promise;
        }).then(isServiceAvailable => {
            this.isGithubServiceAvailable = isServiceAvailable;
            this.log.d("Waiting for the user to introduce their github credentials");
        }).catch(e => {
            this.log.w("Ignoring error: ", e);
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
                repo.provider = this.BITBUCKET_PROVIDER;
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
            let pr = new PullRequest(pullrequest.id, pullrequest.title, prDate, pullrequest.destination.commit.hash, pullrequest.author);

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
                repository.provider = this.BITBUCKET_PROVIDER;
                this.selectedRepositories.push(repository);
            } else if (auxUrl) {
                auxUrl = nextCommits.next;
            }
        }
        return repository;
    }

    private init(): Promise<void> {
        this.userTeam = this.contractManagerService.getCurrentTeam();
        this.log.d("The user team is: ", this.userTeam);
        return this.contractManagerService.getTeamMembersInfo()
        .then((teamMember: Array<Array<TeamMember>>) => {
            const members = teamMember[0].concat(teamMember[1]);
            this.log.d("Users: ", members);
            this.allEmails = members.map(userRep => userRep.email).sort();
            const user = members.filter(userRep => userRep.address === this.userAddress);
            this.userEmail = user[0].email;
            this.setUpList(this.searchInput);
            return this.contractManagerService.getRandomReviewer();
        }).then((isRandomReviewers: boolean) => {
            this.isRandomReviewers = isRandomReviewers;
            if (this.isRandomReviewers) {
                this.selectRandomReviewers();
            } else{
                this.setStorageEmails();
            }
        }).catch((e) => {
            this.showGuiMessage("addCommit.errorAddView", e);
        });
    }

    private loadBatchConfig(): Promise<void> {
        this.selectedRepositories = new Array<Repository>();
        this.blockChainCommits = new Array<string>();
        this.nextRepositoriesUrl = new Map<string, string>();
        this.isFinishedLoadingRepo = false;
        this.showNextReposOption = false;
        return this.contractManagerService.getCurrentSeason().then((seasonEndDate) => {
            let dateNowSecs = Date.now() / AppConfig.SECS_TO_MS;
            this.seasonLengthIndays = seasonEndDate[2] / AppConfig.DAY_TO_SECS;
            this.seasonDate = seasonEndDate[1] < dateNowSecs ? 
                new Date((seasonEndDate[1] + seasonEndDate[2]) * AppConfig.SECS_TO_MS) : new Date(seasonEndDate[1] * AppConfig.SECS_TO_MS);
            return this.contractManagerService.getCommits();
        }).then(commits => {
            commits = commits.filter(com => com);    
            this.blockChainCommits = commits.map(com => {
                return com.url.indexOf("pull-requests") >= 0 ? com.url : com.urlHash;
            });
            this.log.d("The commits from the blockchain", this.blockChainCommits);
            this.seasonDate.setDate(this.seasonDate.getDate() - this.seasonLengthIndays);
            this.currentSeasonStartDate = this.seasonDate;
            this.isoStartDate = this.currentSeasonStartDate.toISOString().split("T")[0];
        }).catch((e) => {
            this.log.e("Error getting blockchain config: ", e);
            throw e;
        });
    }

    private setBatch() {
        this.commitMethod = this.BATCH_METHOD;
        this.isBatchLogged = true;
    }

    private setStorageEmails() {
        let mailString = this.storageSrv.get(AppConfig.StorageKey.USERMAILS);
        if (mailString) {
            let mailArray = mailString.split(";");
            mailArray.forEach(mail => {
                this.log.d("Setting email from local Storage: " + mail);
                this.setEmailFromList(mail);
            });
        }
    }
}
