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
    public arrayCommits = new Array<UserCommit>();
    public selectedComit = <UserCommit>{};
    public selectedDetailsComit = <CommitDetails>{};
    public projects = new Array<string>();
    public projectSelected = this.ALL;
    public commentsArray = new Array<CommitComment>();
    public commitCommentsArray = new Array<Array<CommitComment>>();
    public isButtonPressArray = new Array<boolean>();


    public indice = 0;
    public filterValue = 2;
    public opened = false;

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
            //HOLA
        });
    }

    public setThumbs(url: string, index: number, value: number) {
        this.isButtonPressArray[index] = true;
        this.log.d("Index of the comment: ", index);
        this.log.d("Value: ", value);
        this.log.d("url: ", url);
        this.contractManagerService.setThumbReviewForComment(url, index, value)
            .then((txResponse) => {
                this.log.d("Contract manager response: ", txResponse);
                this.isButtonPressArray[index] = false;
                if (txResponse) {
                    this.refresh();
                    this.isButtonPressArray[index] = false;      
                } else {
                    throw "Error: commitdetails response is undefine";
                }
            }).catch((e) => {
                this.isButtonPressArray[index] = false;
                this.log.e("Can't set the vote", e);
                this.translateService.get("commitDetails.setThumbs").subscribe(
                    msg => {
                        this.msg = msg;
                    });
            });
    }

    public shouldOpen(idx: number): boolean {
        if (typeof this.commitCommentsArray[idx] === "undefined") {
            return false;
        } else {
            if (this.commitCommentsArray[idx].length === 0) {
                return false;
            } else {
                return true;
            }
        }


    }

    public ionViewWillEnter() {
        this.refresh();
        this.selectedComit = new UserCommit();
    }

    public refresh() {

        let commitsArray;

        this.contractManagerService.getCommits()
            .then((arrayOfCommits: UserCommit[]) => {
                this.log.d("ARRAY Commits: ", arrayOfCommits);
                commitsArray = arrayOfCommits;

                return Promise.all(arrayOfCommits.map((commitVals) => {
                    return this.contractManagerService.getCommentsOfCommit(commitVals.url);
                }));
            }).then((commitComments: CommitComment[][]) => {

                let projects = new Array<string>();
                for (let commitVals of commitsArray) {
                    let commitProject = commitVals.project;
                    if (projects.indexOf(commitProject) < 0) {
                        projects.push(commitProject);
                    }
                }
                this.projects = projects;
                this.log.d("Diferent projects: ", this.projects);



                let filterArray = new Array<UserCommit>();
                let filterCommentArray = new Array<Array<CommitComment>>();
                let indice = 0;
                for (let j = 0; j < commitsArray.length; j++) {

                    if (this.projectSelected === commitsArray[j].project) {
                        filterArray[indice] = commitsArray[j];
                        filterCommentArray[indice] = commitComments[j];
                        indice++;
                    }
                }    
                if (this.projectSelected === this.ALL) {
                    filterArray = commitsArray;
                    filterCommentArray = commitComments;
                    console.log("FILTRADO");
                }
                this.arrayCommits = filterArray.reverse();
                this.commitCommentsArray = filterCommentArray.reverse();

                
                
                let index = 0; 
                let array = new Array<UserCommit>();
                let commentArray = new Array<Array<CommitComment>>();               
                switch(this.filterValue) {
                    case 0:                        
                        for (let j = 0; j < filterArray.length; j++) {
                            if (filterArray[j].isPending) {
                                array[index] = filterArray[j];
                                commentArray[index] = filterCommentArray[j];
                                index++;
                            }
                        }
                        this.arrayCommits = array.reverse();
                        this.commitCommentsArray = commentArray.reverse();
                        break;
                    case 1:                        
                        for (let j = 0; j < filterArray.length; j++) {
                            if (!filterArray[j].isPending) {
                                array[index] = filterArray[j];
                                commentArray[index] = filterCommentArray[j];
                                index++;
                            }
                        }
                        this.arrayCommits = array.reverse();
                        this.commitCommentsArray = commentArray.reverse();
                        break;
                    default:
                        break;
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
