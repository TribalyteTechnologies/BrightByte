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
    public selectedCommit: any;

    public selectedRepotories: Repository[];
    public repoSelection: String;
    public logged = false;

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
        private navParams: NavParams
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

        if(this.navParams.data) {
            if(this.navParams.data.authenticationVerified) {
                this.commitMethod = "batch";
                this.bitbucketSrv.getUsername().then((user) => {
                    this.bitbucketUser = user;
                    this.getRepoByUser();
                });
            }
        }
    }

    public addCommit(url: string, title: string) {
        this.isTxOngoing = true;
        this.clearGuiMessage();
        let errMsgId = null;
        let newCommit: UserCommit;
        this.userDetailsProm.then(userDetails => {
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

    public loginBitbucket() {
        let userAddress = this.loginService.getAccountAddress();
        this.bitbucketSrv.loginBitbucket(userAddress).then((authUrl) => {
            if(authUrl) {
                window.open(authUrl);
                this.viewCtrl.dismiss();
            }
        });
    }

    public getProjectCommits(project: string) {
        this.currentProject = project;
        this.bitbucketSrv.getReposlug(project).then((val) => {
            let commits: Array<any> = val["values"];
            let filteredList = commits.filter((com) => {
                let author: any = com["author"]["user"]["nickname"];
                return author === this.bitbucketUser["username"];
            });
            filteredList.forEach((com, idx) => {
                let titulo = com["message"].split("\n");
                let object = {
                    "title": titulo[0],
                    "hash": com["hash"]
                };
                this.commitList.push(object);
            });
        });
    }

    public setFromBitbucket(commit: any) {
        this.selectedCommit = commit;
        this.formTitle = commit["title"];
        this.formUrl = "https://bitbucket.org/tribalyte/" + this.currentProject + "/commits/" + commit["hash"];
    }

    public setUploadMethod(method: string) {
        this.commitMethod = method;
        if (method === "batch") {
            this.loginBitbucket();
        }
    }

    public getRepoByUser() {
        let commitsFirstPage;
        this.selectedRepotories = new Array<Repository>();
        this.contractManagerService.getCommits().then(commits => {
            let blockchainCommits = new Array<String>();
            commits.forEach(com => {
                blockchainCommits.push(com["urlHash"]);
            });
            return blockchainCommits;
        }).then(blockchainCommits => {
            this.bitbucketSrv.getRepositories().then((results) => {
                results.map((res) => {
                    let repo: Repository = new Repository();
                    repo.name = res["name"];
                    repo.slug = res["slug"];
                    repo.numCommits = 0;
                    repo.commits = new Array<string>();
                    commitsFirstPage = this.bitbucketSrv.getReposlug(repo.slug).then((commits) => {
                        commits["values"].forEach(com => {
                            let comDate = new Date(com["date"]);
                            let seasonDate = new Date("2019-11-01");
                            if (com["author"]["user"]["nickname"] === this.bitbucketUser["username"]
                                && comDate >= seasonDate && blockchainCommits.indexOf(com["hash"]) < 0) {
                                repo.commits.push(com["hash"]);
                                repo.numCommits++;
                            }
                        });
                        let nextCommits = commits["next"];
                        if (nextCommits == null) {
                            this.logged = true;
                            this.selectedRepotories.push(repo);
                        }
                        return nextCommits;
                    });
                    Promise.all([commitsFirstPage]).then(([nextCommits]) => {
                        if (nextCommits != null) {
                            this.nextCommitsPage(repo, nextCommits, blockchainCommits);
                            this.logged = true;
                        }
                    });
                });
            });
        });
    }

    public nextCommitsPage(repo: Repository, url: any, blockchainCommits: String[]) {
        let auxUrl = url;
        this.bitbucketSrv.getNextReposlug(auxUrl).then((nextCommits) => {
            nextCommits["values"].forEach(com => {
                let comDate = new Date(com["date"]);
                let seasonDate = new Date("2019-11-01");

                if (comDate < seasonDate) {
                    auxUrl = null;
                    return;
                }

                if (com["author"]["user"]["nickname"] === this.bitbucketUser["username"]
                    && blockchainCommits.indexOf(com["hash"]) < 0) {
                    repo.commits.push(com["hash"]);
                    repo.numCommits++;
                }
            });

            if (auxUrl == null) {
                this.selectedRepotories.push(repo);
            } else {
                auxUrl = nextCommits["next"];
                this.nextCommitsPage(repo, auxUrl, blockchainCommits);
            }
        });
    }

    public addRepo(repoSelection: string) {
        let filteredList = new Array<string>();
        this.selectedRepotories.filter((repo) => {
            if (repo != null && repoSelection === repo.name) {
                filteredList = repo.commits.filter((com) => {
                    let author: any = com["author"]["user"]["nickname"];
                    return author === this.bitbucketUser["username"];
                });
            }
        });
        filteredList.forEach((com, idx) => {
            let title = com["title"];
            let comUrl = "https://bitbucket.org/tribalyte/" + repoSelection + "/commits/" + com["hash"];
            this.addCommit(comUrl, title);
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
