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
import { Repository } from "../../models/repository.model";
import { CommitInfo, BitbucketCommitInfo } from "../../models/commit-info.model";
import { SpinnerService } from "../../core/spinner.service";
import { BitbucketRepository } from "../../models/repository.model";
import { PullRequest, BitbucketPullResquest } from "../../models/pull-request.model";

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

    public selectedRepositories = new Array<Repository>();
    public repoSelection: String;
    public isBatchLogged = false;
    public showSpinner = false;

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
        private bitbucketSrv: BitbucketService,
        private spinnerSrv: SpinnerService
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
                this.bitbucketSrv.getUsername().then((user) => {
                    this.bitbucketUser = user;
                    this.isBatchLogged = true;
                    this.loadUserPendingCommitsAndPR();
                });
            });
    }

    public ionViewDidLeave() {
        this.loginSubscription.unsubscribe();
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
                        .catch(err => Promise.reject({ msg: "addCommit.addingCommit", err: err }));
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
                this.viewCtrl.dismiss(newCommit);
            }).catch(e => {
                this.showGuiMessage(e.msg, e.err);
                this.isTxOngoing = false;
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

    public refreshSearchbar(ev: any) {
        let val = ev.target.value;
        this.searchInput = val;
        this.setUpList(val);
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
        if (method === this.BATCH_METHOD) {
            this.loginToBitbucket();
        }
    }

    public loadUserPendingCommitsAndPR(): Promise<void> {
        this.selectedRepositories = new Array<Repository>();
        let repositories = new Array<BitbucketRepository>();
        let blockChainCommits = new Array<string>();
        return this.contractManagerService.getCurrentSeason().then((seasonEndDate) => {
            let seasonDate = new Date(1000 * seasonEndDate[1]);
            seasonDate.setMonth(seasonDate.getMonth() - this.SEASON_IN_MONTHS);
            return seasonDate;
        }).then(seasonDate => {
            this.currentSeasonStartDate = seasonDate;
            return this.bitbucketSrv.getRepositories(seasonDate);
        }).then(results => {
            this.showSpinner = true;
            repositories = results;
            this.log.d("The repositories from Bitbucket are: ", results);
            return this.contractManagerService.getCommits();
        }).then(commits => {
            blockChainCommits = commits.map(com => {
                return com.url.includes("pull-requests") ? 
                       com.url.substring(BitbucketApiConstants.BASE_URL.length, com.url.length) : com.urlHash;
            });
            this.log.d("The commits from the blockchain", blockChainCommits);
            let promises = repositories.map(repository => {
                return this.handleRepository(repository, blockChainCommits);
            });
            return Promise.all(promises);
        }).then(() => {
            this.showSpinner = false;
            this.log.d("All the commits from the respos", this.selectedRepositories);
            return Promise.resolve();
        });
    }

    public addRepo(repoSelection: string) {
        this.spinnerSrv.showLoader();
        this.selectedRepositories.filter((repo) => {
            if (repo != null && repoSelection === repo.name) {
                repo.commitsInfo.reduce(
                    (prevVal, commit) => {
                        return prevVal.then(() => {
                            let comUrl = BitbucketApiConstants.BASE_URL + BitbucketApiConstants.WORKSPACE
                                + repoSelection.toLowerCase() + "/commits/" + commit.hash;
                            return this.addCommit(comUrl, commit.name);
                        });
                    },
                    Promise.resolve()
                ).then(() => {
                    return repo.pullRequestsNotUploaded.reduce(
                        (prevVal, pullrequest) => {
                            return prevVal.then(() => {
                                let prUrl = BitbucketApiConstants.BASE_URL + BitbucketApiConstants.WORKSPACE
                                    + repoSelection.toLowerCase() + "/pull-requests/" + pullrequest.id;
                                return this.addCommit(prUrl, pullrequest.title);
                            });
                        },
                        Promise.resolve()
                    );
                }).then(() => {
                    this.spinnerSrv.hideLoader();
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
        this.bitbucketSrv.checkProviderAvailability(userAddress).then(user => {
            this.commitMethod = this.BATCH_METHOD;
            this.log.d("Waiting for the user to introduce their credentials");
        });
    }

    private handleRepository(repository: BitbucketRepository, blockChainCommits: Array<string>): Promise<void> {
        let repo: Repository = new Repository(repository.slug, repository.name);
        repo.commitsInfo = new Array<CommitInfo>();
        repo.pullRequests = new Array<PullRequest>();
        repo.pullRequestsNotUploaded = new Array<PullRequest>();
        return this.bitbucketSrv.getPullRequests(repo.slug).then(pr => {
            let promise = this.manageProviderPullRequests(repo, pr.values, blockChainCommits);
            return Promise.all([promise]).then(() => {
                return this.getNextPullrequests(repo, pr.next, blockChainCommits);
            });
        }).then(() => {
            return this.bitbucketSrv.getReposlug(repo.slug);
        }).then(async commits => {
            let prCommits = new Array<string>();
            repo.pullRequests.forEach(pr => {
                prCommits = prCommits.concat(pr.commitsHash);
            });

            repo = this.manageProviderCommits(repo, commits.values, blockChainCommits, prCommits);
            let nextCommits = commits.next;
            if (nextCommits == null && (repo.numCommits > 0 || repo.numPRsNotUploaded > 0)) {
                this.hasNewCommits = true;
                repo.commitsInfo.sort((comA, comB) => {
                    return (comA.date >= comB.date) ? 1 : -1;
                });
                repo.pullRequestsNotUploaded.sort((comA, comB) => {
                    return (comA.date >= comB.date) ? 1 : -1;
                });
                this.selectedRepositories.push(repo);
            }
            if (nextCommits && (repo.numCommits > 0 || repo.numPRsNotUploaded > 0)) {
                repo = await this.getNextPages(repo, nextCommits, blockChainCommits, prCommits);
            }
            return Promise.resolve();
        });
    }  

    private manageProviderPullRequests(repo: Repository, pullrequestsResponse: Array<BitbucketPullResquest>,
                                       blockChainCommits: Array<string>): Promise<void> {
        let promises = pullrequestsResponse.map(pullrequest => {
            let prDate = new Date(pullrequest.updated_on);
            let pr = new PullRequest(pullrequest.id, pullrequest.title, pullrequest.author, prDate, pullrequest.destination.commit.hash);
            if (pullrequest.author.nickname === this.bitbucketUser && prDate >= this.currentSeasonStartDate) {
                return this.bitbucketSrv.getPRCommits(pullrequest.links.commits.href).then(async PRCommits => {
                    pr.commitsHash = PRCommits.values.map(com => com.hash);
                    let nextUrl = PRCommits.next;
                    return nextUrl;
                }).then(async nextUrl => {
                    while (nextUrl) {
                        let nextPRCommits = await this.bitbucketSrv.getNextReposlug(nextUrl);
                        let filtedHashes = nextPRCommits.values.map(com => com.hash);
                        pr.commitsHash = pr.commitsHash.concat(filtedHashes);
                        nextUrl = nextPRCommits.next;
                    }
                    repo.numPRs = repo.pullRequests.push(pr);
                    let partialUrl = BitbucketApiConstants.WORKSPACE + repo.slug + "/pull-requests/" + pullrequest.id;
                    if (blockChainCommits.indexOf(partialUrl) < 0) {
                        repo.numPRsNotUploaded = repo.pullRequestsNotUploaded.push(pr);
                    }
                });
            }
            return Promise.resolve();
        });
        return Promise.all(promises).then(() => {
            return Promise.resolve();
        });
    }

    private async getNextPullrequests(repository: Repository, nextCommitsUrl: string,
                                      blockChainCommits: Array<string>): Promise<void> {
        let auxUrl = nextCommitsUrl;
        while (auxUrl) {
            let nextCommits = await this.bitbucketSrv.getNextPullrequest(auxUrl);
            await this.manageProviderPullRequests(repository, nextCommits.values, blockChainCommits);
            auxUrl = nextCommits.next;
        }
        return Promise.resolve();
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
            if (auxUrl == null && (repository.numCommits > 0 || repository.numPRsNotUploaded > 0)) {
                this.hasNewCommits = true;
                repository.commitsInfo.sort((comA, comB) => {
                    return (comA.date >= comB.date) ? 1 : -1;
                });
                repository.pullRequestsNotUploaded.sort((comA, comB) => {
                    return (comA.date >= comB.date) ? 1 : -1;
                });
                this.selectedRepositories.push(repository);
            } else if (auxUrl) {
                auxUrl = nextCommits.next;
            }
        }
        return repository;
    }
}
