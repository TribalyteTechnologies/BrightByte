import { Component } from "@angular/core";
import { NavController, PopoverController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { AddCommitPopover } from "../../pages/addcommit/addcommit";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { CommitDetailsPage } from "../../pages/commitdetails/commitdetails";
import { TranslateService } from "@ngx-translate/core";
import { SplitService } from "../../domain/split.service";
import { UserCommit } from "../../models/user-commit.model";
import { CommitDetails } from "../../models/commit-details.model";

@Component({
    selector: "page-commits",
    templateUrl: "commits.html"
})

export class CommitPage {
    public readonly ALL = "all";
    public arrayCommits = new Array<UserCommit>();
    public projects = new Array<string>();
    public projectSelected = this.ALL;
    public msg: string;
    private log: ILogger;

    constructor(
        public popoverCtrl: PopoverController,
        public navCtrl: NavController,
        public http: HttpClient,
        private splitService: SplitService,
        public translateService: TranslateService,
        private contractManagerService: ContractManagerService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("CommitsPage");

    }


    public openAddCommitDialog() {
        let popover = this.popoverCtrl.create(AddCommitPopover, { cssClass: "custom-popover" });
        popover.present();
        popover.onDidDismiss(() => {
            this.refresh();
        });
    }
    public selectUrl(commit: UserCommit, index: number) {
        let project = this.splitService.getProject(commit.url);
        let isReadReviewNeeded = commit.isReadNeeded;
        this.contractManagerService.getDetailsCommits(commit.url)
            .then((detailsCommit: CommitDetails) => {
                if (isReadReviewNeeded) {
                    //Change flag
                    this.contractManagerService.reviewChangesCommitFlag(commit.url)
                        .then((txResponse) => {
                            this.log.d("Contract manager response: ", txResponse);
                        }).catch((e) => {
                            this.log.e("Error Changing the state of the flag to false", e);
                        });
                }
                this.log.d("Details commits: ", detailsCommit);
                this.log.d("Index of row pressed: ", index);
                this.navCtrl.push(CommitDetailsPage, {
                    commitDetails: detailsCommit,
                    commitProject: project,
                    commitIndex: index,
                    url: commit.url
                });
            }).catch((e) => {
                this.translateService.get("addCommit.commitDetails").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
    }
    public ionViewWillEnter() {
        this.refresh();
    }
    public refresh() {
        this.contractManagerService.getCommits()
            .then((arrayOfCommits: UserCommit[]) => {
                this.log.d("ARRAY Commits: ", arrayOfCommits);

                let projects = new Array<string>();
                for (let commitVals of arrayOfCommits) {
                    let commitProject = commitVals.project;
                    if (projects.indexOf(commitProject) < 0) {
                        projects.push(commitProject);
                    }
                }
                this.projects = projects;
                this.log.d("Diferent projects: ", this.projects);
                let index = 0;
                let array = new Array<UserCommit>();
                for (let j = 0; j < arrayOfCommits.length; j++) {
                    if (this.projectSelected === arrayOfCommits[j].project) {
                        array[index] = arrayOfCommits[j];
                        index++;
                    }
                }
                if (this.projectSelected === this.ALL) {
                    this.arrayCommits = arrayOfCommits.reverse();
                } else {
                    this.arrayCommits = array.reverse();
                }
            }).catch((e) => {
                this.translateService.get("commits.getCommits").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
    }
    public pendingReviewedSelector(value: number) {
        switch (value) {
            case 0:
                this.contractManagerService.getCommits()
                    .then((arrayOfCommits: UserCommit[]) => {
                        this.log.d("ARRAY Commits: ", arrayOfCommits);
                        let index = 0;
                        let array = new Array<UserCommit>();
                        for (let j = 0; j < arrayOfCommits.length; j++) {
                            if (arrayOfCommits[j].isPending && 
                                (this.projectSelected === arrayOfCommits[j].project || this.projectSelected === this.ALL)) {
                                array[index] = arrayOfCommits[j];
                                index++;
                            }
                        }
                        this.arrayCommits = array.reverse();
                    }).catch((e) => {
                        this.translateService.get("commits.getCommitsPending").subscribe(
                            msg => {
                                this.msg = msg;
                                this.log.e(msg, e);
                            });
                    });
                break;
            case 1:
                this.contractManagerService.getCommits()
                    .then((arrayOfCommits: UserCommit[]) => {
                        this.log.d("ARRAY Commits: ", arrayOfCommits);
                        let index = 0;
                        let array = new Array<UserCommit>();
                        for (let j = 0; j < arrayOfCommits.length; j++) {
                            if (!arrayOfCommits[j].isPending && 
                                (this.projectSelected === arrayOfCommits[j].project || this.projectSelected === this.ALL)) {
                                array[index] = arrayOfCommits[j];
                                index++;
                            }
                        }
                        this.arrayCommits = array.reverse();
                    }).catch((e) => {
                        this.translateService.get("commits.getCommitsPending").subscribe(
                            msg => {
                                this.msg = msg;
                                this.log.e(msg, e);
                            });
                    });
                break;
            default: this.refresh(); break;
        }
    }
}
