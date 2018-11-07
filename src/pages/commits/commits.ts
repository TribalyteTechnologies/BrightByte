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
    public isButtonPressArray = new Array<boolean>();
    public openedComments = false;
    public indice = 0;
    public filterValue = 2;
    public filterIsPending = false;
    public filterIsIncompleted = false;
    public filterIsReviewed = false;
    public msg: string;
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


    public openAddCommitDialog() {
        let popover = this.popoverCtrl.create(AddCommitPopover, { cssClass: "custom-popover" });
        popover.present();
        popover.onDidDismiss(() => {
            this.refresh();
        });
    }

    public setThumbs(url: string, index: number, value: number) {
        this.isButtonPressArray[index] = true;
        this.log.d("Index of the comment: ", index);
        this.log.d("Value: ", value);
        this.log.d("url: ", url);
        this.contractManagerService.setThumbReviewForComment(url, index, value)
            .then(txResponse => {
                this.log.d("Contract manager response: ", txResponse);
                if (txResponse) {
                    this.isButtonPressArray[index] = false;      
                    this.refresh();
                } else {
                    throw "Error: commitdetails response is undefine";
                }
            }).catch(e => {
                this.isButtonPressArray[index] = false;
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

    public shouldOpen(idx: number) {
        let commentList = this.arrayCommits[idx];
        if (typeof commentList === "undefined"){
            this.openedComments = false;
        } else {
            if(commentList.commit.isReadNeeded){
                console.log(commentList.commit.url);
                this.contractManagerService.reviewChangesCommitFlag(commentList.commit.url)
                .then((txResponse) => {
                    this.log.d("Contract manager response: ", txResponse);
                }).catch((e) => {
                    this.log.e("Error Changing the state of the flag to false", e);
                });
            }
            this.refresh();
            this.openedComments = (commentList && commentList.reviews.length > 0);
        }
    }

    public ionViewWillEnter() {
        this.refresh();
    }

    public refresh() {

        let commitsArray;
        let commentsArray;
        let detailsArray;

        this.contractManagerService.getCommits()
            .then((arrayOfCommits: UserCommit[]) => {
                commitsArray = arrayOfCommits;
                return Promise.all(arrayOfCommits.map(commitVals => {
                    return this.contractManagerService.getCommentsOfCommit(commitVals.url);
                }));
            }).then((commitComments: CommitComment[][]) => {
                commentsArray = commitComments;
                return Promise.all(commitsArray.map(commitVals => {
                    return this.contractManagerService.getDetailsCommits(commitVals.url);
            }));
            }).then((commitDetails: CommitDetails[]) => {
                detailsArray = commitDetails.map((details, idx) => {
                    return {"commit": commitsArray[idx], "reviews": commentsArray[idx], "details": details};
                });
                return detailsArray;
            }).then((unfilteredCommits) => {
                
                let projects = new Array<string>();
                for (let commitVals of unfilteredCommits) {
                    let commitProject = commitVals.commit.project;
                    if (projects.indexOf(commitProject) < 0) {
                        projects.push(commitProject);
                    }
                }
                this.projects = projects;
                this.log.d("Diferent projects: ", this.projects);
                
                let commitList = [];
                for (let j = 0; j < unfilteredCommits.length; j++) {
                    if (this.projectSelected === unfilteredCommits[j].commit.project) {
                        commitList.push({
                            "commit": unfilteredCommits[j].commit, 
                            "reviews": unfilteredCommits[j].reviews, 
                            "details": unfilteredCommits[j].details
                        });
                    }
                }    
                if (this.projectSelected === this.ALL) {
                    commitList = [];
                    for (let j = 0; j < unfilteredCommits.length; j++){
                        commitList.push({
                            "commit": unfilteredCommits[j].commit, 
                            "reviews": unfilteredCommits[j].reviews, 
                            "details": unfilteredCommits[j].details
                        });
                    }
                }
                let filteredCommitList = [];
                switch(this.filterValue){
                    case 0:
                        for (let j = 0; j < commitList.length; j++) {
                            if (commitList[j].details.numberReviews !== commitList[j].details.currentNumberReviews) {
                                filteredCommitList.push(commitList[j]);
                            }
                        }
                        break;
                    case 1:
                        for (let j = 0; j < commitList.length; j++) {
                            if (commitList[j].details.numberReviews === commitList[j].details.currentNumberReviews) {
                                filteredCommitList.push(commitList[j]);
                            }
                        }
                        break;
                    default:
                        filteredCommitList = commitList;
                        break;
                }

                let filteredPendingCommitList = [];
                if(this.filterIsPending){
                    for (let j = 0; j < filteredCommitList.length; j++){
                        if (filteredCommitList[j].commit.isReadNeeded){
                            filteredPendingCommitList.push(filteredCommitList[j]);
                        }
                    }
                } else {
                    filteredPendingCommitList = filteredCommitList;
                }

                this.arrayCommits = filteredPendingCommitList.sort((c1, c2) => { 
                    return c2.commit.creationDateMs - c1.commit.creationDateMs;
                });

            }).catch((e) => {
                this.translateService.get("commits.getCommits").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });

    }

}
