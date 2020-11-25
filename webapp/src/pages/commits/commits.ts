import { Component } from "@angular/core";
import { NavController, PopoverController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { AddCommitPopover } from "../../pages/addcommit/addcommit";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { UserCommit } from "../../models/user-commit.model";
import { CommitComment } from "../../models/commit-comment.model";
import { SpinnerService } from "../../core/spinner.service";
import { SessionStorageService } from "../../core/session-storage.service";
import { AppConfig } from "../../app.config";
import { AlertController } from "ionic-angular";
import { PopupService } from "../../domain/popup.service";
import { LoginService } from "../../core/login.service";
import { Observable } from "rxjs";
import { TransactionExecutorService } from "../../domain/transaction-executor.service";

@Component({
    selector: "page-commits",
    templateUrl: "commits.html"
})

export class CommitPage {

    public readonly ALL = "all";
    public readonly INCOMPLETE = "incomplete";
    public readonly COMPLETE = "complete";
    public teamUid: number;
    public version: number;
    public arrayCommits = new Array<UserCommit>();
    public filterArrayCommits = new Array<UserCommit>();
    public currentCommit: UserCommit;
    public commitComments = new Array<CommitComment>();
    public projects = new Array<string>();
    public projectSelected = this.ALL;
    public openedComments = false;
    public currentCommitName = "";
    public currentCommitEmail = "";
    public filterValue = "";
    public filterIsPending = false;
    public msg: string;
    public isSpinnerLoadingObs: Observable<boolean>;
    private log: ILogger;


    constructor(
        public popoverCtrl: PopoverController,
        public navCtrl: NavController,
        public http: HttpClient,
        public translateService: TranslateService,
        public spinnerService: SpinnerService,
        public storageSrv: SessionStorageService,
        private contractManagerService: ContractManagerService,
        private alertCtrl: AlertController,
        private popupSrv: PopupService,
        private loginService: LoginService,
        private transactionSrv: TransactionExecutorService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("CommitsPage");
        this.filterValue = this.storageSrv.get(AppConfig.StorageKey.COMMITFILTER);
        this.filterIsPending = this.storageSrv.get(AppConfig.StorageKey.COMMITPENDINGFILTER) === "true";
        this.teamUid = this.loginService.getTeamUid();
        this.version = this.loginService.getCurrentVersion();
    }

    public ngOnInit() {
        this.isSpinnerLoadingObs = this.transactionSrv.getProcessingStatus();
        this.refresh();
    }

    public refresh() {
        this.log.d("Refreshing page");
        this.spinnerService.showLoader();
        let commits: Array<UserCommit>;
        this.contractManagerService.getCommits()
            .then((commitConcat: Array<UserCommit>) => {
                this.log.d("User Commits received");
                commits = commitConcat.filter(commit => commit);

                let reviewers = commits.map((commit) => {
                    return this.contractManagerService.getReviewersName(commit.url);
                });
                return Promise.all(reviewers);
            }).then((reviewers) => {
                this.log.d("Reviewers from commits recieved");
                commits.forEach((com, idx) => {
                    com.reviewers = reviewers[idx];
                });
                let projects = commits.map(commit => commit.project);
                this.projects = projects.filter((value, index, array) => array.indexOf(value) === index);

                this.arrayCommits = commits;
                this.applyFilters(this.arrayCommits);
                this.spinnerService.hideLoader();
            }).then(() => {
                let url = new URLSearchParams(document.location.search);
                if (url.has(AppConfig.UrlKey.COMMITID)) {
                    let decodedUrl = decodeURIComponent(url.get(AppConfig.UrlKey.COMMITID));
                    let filteredCommit = this.filterArrayCommits.filter(c => c.url === decodedUrl);
                    this.shouldOpen(filteredCommit[0]);
                }

            }).catch((e) => {
                this.translateService.get("commits.getCommits").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                        this.spinnerService.hideLoader();
                    });
                throw e;
            });
    }

    public openAddCommitDialog() {
        let popover = this.popoverCtrl.create(AddCommitPopover, {}, { cssClass: "add-commit-popover" });
        popover.present();
        popover.onDidDismiss((newCommit) => {
            if (newCommit) {
                this.arrayCommits.push(newCommit);
                this.applyFilters(this.arrayCommits);
            }
        });
    }

    public setThumbs(url: string, index: number, value: number) {
        this.commitComments[index].vote = value;
        this.contractManagerService.setThumbReviewForComment(url, index, value)
            .then(txResponse => {
                this.log.d("Contract manager response: ", txResponse);
            }).catch(e => {
                this.log.e("Cant set the vote", e);
                this.translateService.get("commitDetails.setThumbs").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    }
                );
                throw e;
            });
    }


    public applyFilters(usercommits: Array<UserCommit>) {
        let projectFilter = this.setProjectFilter(usercommits);
        let statusFilter = this.setStatusFilter(projectFilter);
        let pendingFilter = this.setPendingFilter(statusFilter);
        this.filterArrayCommits = pendingFilter.sort((c1, c2) => {
            return (c2.creationDateMs - c1.creationDateMs);
        });
    }

    public setFilter(name: string) {
        switch (name) {
            case this.INCOMPLETE:
                this.filterValue === this.INCOMPLETE ? this.filterValue = "" : this.filterValue = this.INCOMPLETE;
                break;
            case this.COMPLETE:
                this.filterValue === this.COMPLETE ? this.filterValue = "" : this.filterValue = this.COMPLETE;
                break;
            case "pending":
                this.filterIsPending = !this.filterIsPending;
                break;
            default:
                this.filterValue = "";
                break;
        }
        this.openedComments = false;
        if (this.filterValue !== null) {
            this.storageSrv.set(AppConfig.StorageKey.COMMITFILTER, this.filterValue.toString());
        }
        this.storageSrv.set(AppConfig.StorageKey.COMMITPENDINGFILTER, this.filterIsPending.toString());
        this.applyFilters(this.arrayCommits);
    }

    public setProject(name: string) {
        this.projectSelected = name;
        this.applyFilters(this.arrayCommits);
    }

    public shouldOpen(commit: UserCommit) {

        this.spinnerService.showLoader();
        this.log.d("Opening commit: " + commit.url);
        this.contractManagerService.getCommentsOfCommit(commit.url)
            .then((comments: Array<CommitComment>) => {
                this.log.d("We received " + comments.length + " comments");
                this.commitComments = comments;
                this.currentCommit = commit;
                this.openedComments = this.commitComments.length > 0;
                this.log.d("Changing flag of " + commit.url);
                this.spinnerService.hideLoader();
                return this.getReviewerName(commit);
            }).then((name) => {
                this.currentCommitName = name[0];
                this.currentCommitEmail = name[1];
                const isReadNeeded = commit.isReadNeeded;
                commit.isReadNeeded = false;
                return isReadNeeded ? 
                    this.contractManagerService.reviewChangesCommitFlag(commit.url) :
                    Promise.resolve();
            }).then((response) => {
                this.log.d("Received response: " + response);
                let idx = this.filterArrayCommits.indexOf(commit);
                this.filterArrayCommits[idx] = commit;
            }).catch((err) => {
                this.log.e(err);
                this.spinnerService.hideLoader();
            });
    }

    public deleteCommit(commit: UserCommit) {
        this.log.d("The user request to erase the commit: " + commit.url);
        this.spinnerService.showLoader();
        this.contractManagerService.deleteCommit(commit.url)
            .then(res => {
                this.currentCommit = null;
                this.refresh();
            }).catch((err) => {
                this.log.e(err);
                this.spinnerService.hideLoader();
                throw err;
            });
    }

    public presentConfirm(commit: UserCommit) {
        let alert = this.alertCtrl.create({
            title: "Delete Confirm",
            message: "You are about to delete this commit. Are you sure you want to permanently delete this commit?",
            buttons: [
                {
                    text: "Cancel",
                    role: "cancel",
                    handler: () => {
                        this.log.d("Cancel clicked");
                    }
                },
                {
                    text: "Delete",
                    handler: () => {
                        this.log.d("Delete clicked" + commit.url);
                        this.deleteCommit(commit);
                    }
                }
            ]
        });
        alert.present();
    }

    public openUrl(url: string) {
        this.popupSrv.openUrlNewTab(url);
    }


    private getReviewerName(commit: UserCommit): Promise<Array<string>> {
        let hash = commit.author;
        return this.contractManagerService.getUserDetails(hash)
            .then((user) => {
                return [user.name, user.email];
            }).catch((e) => {
                this.log.e(e);
                return ["Anonymous", "nomail@web.com"];
            });
    }

    private setProjectFilter(usercommits: Array<UserCommit>): Array<UserCommit> {
        if (this.projectSelected !== this.ALL) {
            return usercommits.filter(commit => {
                return (commit.project === this.projectSelected);
            });
        } else {
            return usercommits;
        }
    }
    private setStatusFilter(usercommits: Array<UserCommit>): Array<UserCommit> {
        switch (this.filterValue) {
            case this.INCOMPLETE:
                return usercommits.filter(commit => {
                    return (commit.numberReviews !== commit.currentNumberReviews);
                });
            case this.COMPLETE:
                return usercommits.filter(commit => {
                    return (commit.numberReviews === commit.currentNumberReviews);
                });
            default:
                return usercommits;
        }
    }
    private setPendingFilter(usercommits: Array<UserCommit>): Array<UserCommit> {
        return this.filterIsPending ? usercommits.filter(commit => commit.isReadNeeded) : usercommits;
    }

}
