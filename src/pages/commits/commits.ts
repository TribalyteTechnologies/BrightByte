import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { PopoverController } from "ionic-angular";
import { AddCommitPopover } from "../../pages/addcommit/addcommit";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { CommitDetailsPage } from "../../pages/commitdetails/commitdetails";
import { TranslateService } from "@ngx-translate/core";
import { SplitService } from "../../domain/split.service";

@Component({
    selector: "page-commits",
    templateUrl: "commits.html"
})

export class CommitPage {
    public readonly ALL = "all";
    public arrayCommits = new Array<string>();
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
    public selectUrl(commit: Object) {
        let index: number;
        for (let i = 0; i < this.arrayCommits.length; i++) {
            if (this.arrayCommits[i][0] === commit[0]) {
                index = i;
                break;
            }
        }
        let id = this.splitService.getId(commit[0]);
        let project = this.splitService.getProject(commit[0]);
        let isReadReviewNeeded = commit[4];
        this.contractManagerService.getDetailsCommits(id)
            .then(detailsCommit => {
                if (isReadReviewNeeded) {
                    //Change flag
                    this.contractManagerService.reviewChangesCommitFlag(id)
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
                    commitIndex: index
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
            .then((arrayOfCommits: string[]) => {
                this.log.d("ARRAY Commits: ", arrayOfCommits);

                let projects = new Array<string>();
                for (let commitVals of arrayOfCommits) {
                    let commitProject = commitVals[2]; //TODO: create a model class for commits
                    if (projects.indexOf(commitProject) < 0) {
                        projects.push(commitProject);
                    }
                }
                this.projects = projects;
                this.log.d("Diferent projects: ", this.projects);
                let index = 0;
                let array = new Array<string>();
                for (let j = 0; j < arrayOfCommits.length; j++) {
                    if (this.projectSelected === arrayOfCommits[j][2]) {
                        array[index] = arrayOfCommits[j];
                        index++;
                    }
                }
                if (this.projectSelected === this.ALL) {
                    this.arrayCommits = arrayOfCommits;
                } else {
                    this.arrayCommits = array;
                }
            }).catch((e) => {
                this.translateService.get("commits.getCommits").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
    }
}
