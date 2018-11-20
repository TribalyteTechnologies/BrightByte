import { Component } from "@angular/core";
import { NavController, PopoverController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { AddCommitPopover } from "../../pages/addcommit/addcommit";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { UserCommit } from "../../models/user-commit.model";
import { CommitComment } from "../../models/commit-comment.model";
import { CommitDetails } from "../../models/commit-details.model";

@Component({
    selector: "page-commits",
    templateUrl: "commits.html"
})

export class CommitPage {

    public readonly ALL = "all";
    public arrayCommits = [];
    public selectedDetailsComit = <CommitDetails>{};
    public projects = new Array<string>();
    public projectSelected = this.ALL;
    public commentsArray = new Array<CommitComment>();
    public commitCommentsArray = new Array<Array<CommitComment>>();
    public openedComments = false;
    public globalIndex = 0;
    public filterValue = 2;
    public filterIsPending = false;
    public filterIsIncompleted = false;
    public filterIsReviewed = false;
    public msg: string;
    public commitComments: CommitComment[] = [];

    private log: ILogger;


    constructor(
        public popoverCtrl: PopoverController,
        public navCtrl: NavController,
        public http: HttpClient,
        public translateService: TranslateService,
        private contractManagerService: ContractManagerService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("CommitsPage");
    }

    public ionViewWillEnter() {
        this.refresh();
    }

    public refresh() {

        this.contractManagerService.getCommits()
            .then((commitConcat: UserCommit[][]) => {

                let commits = commitConcat[0].concat(commitConcat[1]);
                console.log(commits);
                let projectFilter: UserCommit[] = [];

                let projects = commits.map( commit => commit.project );
                this.projects = projects.filter((value, index , array) => array.indexOf(value) === index);
                
                if (!(this.projectSelected === this.ALL)){
                    projectFilter = commits.filter(commit => {
                        return (commit.project === this.projectSelected);
                    });
                } else {
                    projectFilter = commits;
                }

                let completedFilter: UserCommit[] = [];
                switch(this.filterValue){
                    case 0:
                        completedFilter = projectFilter.filter(commit => {
                            return (commit.numberReviews !== commit.currentNumberReviews);
                        });
                        break;
                    case 1:
                        completedFilter = projectFilter.filter(commit => {
                            return (commit.numberReviews === commit.currentNumberReviews);
                        });
                        break;
                    default:
                        completedFilter = projectFilter;
                        break;
                }

                let pendingFilter: UserCommit[] = [];
                if(this.filterIsPending){
                    pendingFilter = completedFilter.filter(commit => {
                        return commit.isReadNeeded;
                    });
                } else {
                    pendingFilter = completedFilter;
                }

                this.arrayCommits = pendingFilter.sort((c1, c2) => {
                    return (c2.creationDateMs - c1.creationDateMs);
                });
            }).catch((e) => {
                this.translateService.get("commits.getCommits").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
    }

    public openAddCommitDialog() {
        let popover = this.popoverCtrl.create(AddCommitPopover, { cssClass: "custom-popover" });
        popover.present();
        popover.onDidDismiss(() => {
            this.refresh();
        });
    }

    public setThumbs(url: string, index: number, value: number) {
        this.contractManagerService.setThumbReviewForComment(url, index, value)
            .then(txResponse => {
                if (txResponse) {
                    this.log.d("Contract manager response: ", txResponse);
                    this.openedComments = false;
                    this.refresh();
                } else {
                    throw "Error: commitdetails response is undefine";
                }
            }).catch(e => {
                this.log.e("Can't set the vote", e);
                this.translateService.get("commitDetails.setThumbs").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
    }

    public filterIncompleted(){
        this.filterValue === 0 ? this.filterValue = 2 : this.filterValue = 0;
        this.filterIsIncompleted = !this.filterIsIncompleted;
        if(this.filterIsReviewed){
            this.filterIsReviewed = !this.filterIsReviewed;
        }     
        this.openedComments = false;  
        this.refresh();
    }
    
    public filterCompleted(){
        this.filterValue === 1 ? this.filterValue = 2 : this.filterValue = 1;
        this.filterIsReviewed = !this.filterIsReviewed;
        if(this.filterIsIncompleted){
            this.filterIsIncompleted = !this.filterIsIncompleted;
        }
        this.openedComments = false;  
        this.refresh();
    }

    public filterPending(){
        this.filterIsPending = !this.filterIsPending;
        this.openedComments = false;
        this.refresh();
    }

    public shouldOpen(commit: UserCommit) {
        this.contractManagerService.getCommentsOfCommit(commit.url)
            .then((comments: CommitComment[][]) => {
                this.commitComments = comments[1];
                this.openedComments = comments[1].length > 0;
            });
    }

}
