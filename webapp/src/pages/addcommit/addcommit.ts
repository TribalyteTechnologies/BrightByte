import { Component } from "@angular/core";
import { NavController, NavParams } from "ionic-angular";
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
import { BitbucketService } from "../../domain/bitbucket.service";
import { FormatUtils } from "../../core/format-utils";
import { UserCommit } from "../../models/user-commit.model";
import { Repository } from "../../models/repository.model";
import { CommitInfo } from "../../models/commit-info.model";
import { SpinnerService } from "../../core/spinner.service";

@Component({
    selector: "popover-addcommit",
    templateUrl: "addcommit.html"
})
export class AddCommitPopover {

    public isTxOngoing = false;
    public msg: string;
    public usersMail = new Array<string>();
    public isShowList = new Array<boolean>();
    public mockInputElementList = new Array<any>();
    public arraySearch: string[];
    public myForm: FormGroup;
    public userAdded = new Array<string>();

    public bitbucketForm: FormGroup;
    public bitbucketUser = {};
    public bitbucketProjects: Array<string> = [];
    public commitList = [];
    public formUrl = "";
    public formTitle = "";
    public currentProject = "";
    public commitMethod = "url";
    public currentSeasonStartDate: Date;

    public selectedRepotories: Array<Repository>;
    public repoSelection: String;
    public isBatchLogged = false;

    private allEmails = new Array<string>();
    private searchInput = "";
    private readonly MAX_REVIEWERS = AppConfig.MAX_REVIEWER_COUNT;
    private userDetailsProm: Promise<UserDetails>;
    private log: ILogger;

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
        private navParams: NavParams,
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
        this.userDetailsProm = this.contractManagerService.getUserDetails(this.loginService.getAccountAddress());
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

        if (this.navParams.data) {
            if (this.navParams.data.authenticationVerified) {
                this.commitMethod = "batch";
                this.bitbucketSrv.getUsername().then((user) => {
                    this.bitbucketUser = user;
                    this.getRepoByUser();
                });
            }
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

    public loginToBitbucket() {
        let userAddress = this.loginService.getAccountAddress();
        let userToken = this.bitbucketSrv.getToken();
        if (userToken) {
            this.commitMethod = "batch";
            this.bitbucketUser = this.bitbucketSrv.getUserDetails();
            this.getRepoByUser();
        } else {
            this.bitbucketSrv.loginToBitbucket(userAddress).then((authUrl) => {
                if (authUrl) {
                    window.open(authUrl);
                    this.viewCtrl.dismiss();
                }
            });
        }
    }

    public setUploadMethod(method: string) {
        this.commitMethod = method;
        if (method === "batch") {
            this.loginToBitbucket();
        }
    }

    public getRepoByUser(): Promise<void> {
        this.selectedRepotories = new Array<Repository>();

        let contractManagerResult = this.contractManagerService.getCurrentSeason().then((seasonEndDate) => {
            let seasonDate = new Date(1000 * seasonEndDate[1]);
            seasonDate.setMonth(seasonDate.getMonth() - 4);
            return seasonDate;
        }).then(seasonDate => {
            this.currentSeasonStartDate = seasonDate;
            return this.contractManagerService.getCommits();
        }).then(commits => {
            return commits.map<string>(com => com.urlHash);
        });

        let repositoriesResults = this.bitbucketSrv.getRepositories().then(results => {
            return results;
        });

        return Promise.all([contractManagerResult, repositoriesResults]).then(([contractManagerCommits, repositories]) => {
            let blockChainCommits = contractManagerCommits as Array<string>;
            repositories.forEach((res) => {
                let repo: Repository = new Repository();
                repo.name = res["name"];
                repo.slug = res["slug"];
                repo.numCommits = 0;
                repo.commitsInfo = new Array<CommitInfo>();
                this.bitbucketSrv.getReposlug(repo.slug).then((commits) => {
                    commits["values"].forEach(com => {
                        let comDate = new Date(com.date);
                        if (com.author.user && com.author.user.nickname === this.bitbucketUser["nickname"]
                            && comDate >= this.currentSeasonStartDate && blockChainCommits.indexOf(com.hash) < 0) {
                            let commitInfo = new CommitInfo();
                            commitInfo.hash = com.hash;
                            commitInfo.name = com.message;
                            repo.commitsInfo.push(commitInfo);
                            repo.numCommits++;
                        }
                    });
                    let nextCommits = commits["next"];
                    if (nextCommits == null) {
                        this.isBatchLogged = true;
                        this.selectedRepotories.push(repo);
                    }
                    return nextCommits;
                }).then((nextCommits) => {
                    if (nextCommits != null) {
                        this.getCommitsInNextPage(repo, nextCommits, blockChainCommits);
                        this.isBatchLogged = true;
                    }
                });
            });
        });
    }

    public addRepo(repoSelection: string) {
        this.spinnerSrv.showLoader();
        this.selectedRepotories.filter((repo) => {
            if (repo != null && repoSelection === repo.name) {
                repo.commitsInfo.reduce(
                    (prevVal, commit) => {
                        return prevVal.then(() => {
                            let comUrl = AppConfig.BITBUCKET_BASE_URL + repoSelection + "/commits/" + commit.hash;
                            return this.addCommit(comUrl, commit.name);
                        });
                    },
                    Promise.resolve()
                ).then(() => {
                    this.spinnerSrv.hideLoader();
                });
            }
        });
    }

    private getCommitsInNextPage(repo: Repository, url: string, blockchainCommits: String[]) {
        let auxUrl = url;
        this.bitbucketSrv.getNextReposlug(auxUrl).then((nextCommits) => {
            nextCommits["values"].every((com) => {
                let comDate = new Date(com.date);

                if (comDate < this.currentSeasonStartDate) {
                    auxUrl = null;
                    return false;
                }

                if (com.author.user && com.author.user.nickname === this.bitbucketUser["nickname"]
                    && blockchainCommits.indexOf(com.hash) < 0) {
                    let commitInfo = new CommitInfo();
                    commitInfo.name = com.message;
                    commitInfo.hash = com.hash;
                    repo.commitsInfo.push(commitInfo);
                    repo.numCommits++;
                }
                return true;
            });

            if (auxUrl == null) {
                this.selectedRepotories.push(repo);
            } else {
                auxUrl = nextCommits["next"];
                this.getCommitsInNextPage(repo, auxUrl, blockchainCommits);
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
}
