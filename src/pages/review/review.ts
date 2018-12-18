import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { CommitComment } from "../../models/commit-comment.model";
import { LoginService } from "../../core/login.service";
import { UserCommit } from "../../models/user-commit.model";
import { SpinnerService } from "../../core/spinner.service";

@Component({
    selector: "page-review",
    templateUrl: "review.html"
})

export class ReviewPage {
    
    public readonly ALL = "all";

    public displayCommitsToReview: UserCommit[];
    public arrayCommits: UserCommit[];
    public allCommitsArray: UserCommit[];
    public msg: string;
    public projects = new Array<string>();
    public projectSelected = this.ALL;
    public isFeedback = {} as {[key: string]: boolean};

    public filterValue = 2;
    public filterIsPending = false;
    public filterIsIncompleted = false;
    public filterIsReviewed = false;
    public openedComments = false;
    public needReview = false;

    public star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
    public rate = 0;

    public userCommitComment: CommitComment[];
    public commitComments: CommitComment[];
    public currentCommit: UserCommit;
    
    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        public translateService: TranslateService,
        public spinnerService: SpinnerService,
        private loginService: LoginService,
        private contractManagerService: ContractManagerService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ReviewPage");
        
    }

    public ionViewWillEnter(): void {
        this.refresh();
    }

    public refresh(){

        this.spinnerService.showLoader();
        let commits: UserCommit[];

        this.contractManagerService.getCommitsToReview()
            .then((commitConcat: UserCommit[][]) => {
                commits = commitConcat[0].concat(commitConcat[1]);
                commits = commits.filter(commit => {
                    return commit.url !== "";
                });
                let reviewers = commits.map((commit) => {
                    return this.contractManagerService.getReviewersName(commit.url);
                });
                return Promise.all(reviewers);
            }).then((reviewers) => {

                commits.forEach((com, idx) => {
                    com.reviewers = reviewers[idx];
                });

                let commitsPromises = commits.map((com) => {
                    return this.contractManagerService.getFeedback(com.url)
                        .then((rsp) => {
                            console.log("Response recieved: " + rsp);
                            com.isReadNeeded = rsp;
                            return com;
                        });
                });
                return Promise.all(commitsPromises);
            
            })
            .then((rsp) => {
                
                commits = rsp;

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

                this.displayCommitsToReview = pendingFilter.sort((c1, c2) => {
                    return (c2.creationDateMs - c1.creationDateMs);
                });
                this.spinnerService.hideLoader();


            }).catch((e) => {
                this.translateService.get("commits.getCommits").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
                this.spinnerService.hideLoader();
            });
            
    }

    public shouldOpen(commit: UserCommit) {
        
        
        this.spinnerService.showLoader();

        this.contractManagerService.getCommentsOfCommit(commit.url)
            .then((comments: CommitComment[][]) => {
                this.openedComments = true;
                this.commitComments = comments[1];
                
                let allComments: CommitComment[] = comments[1];
                let userAdress = this.loginService.getAccount().address;
                this.userCommitComment = allComments.filter((commitUR) => {
                    return commitUR.user === userAdress;
                });
                let idx = allComments.indexOf(this.userCommitComment[0]);
                if(idx !== -1){
                    allComments.splice(idx, 1);
                    this.commitComments = allComments;
                    this.needReview = false;
                } else {
                    this.commitComments = allComments;
                    this.needReview = true;
                }
                this.currentCommit = commit;
                this.openedComments = true; 
                return this.contractManagerService.setFeedback(commit.url);
            }).then((val) => {
                this.log.d("Feedback response: " + val);
                this.refresh();
            }).catch(err => {
                this.spinnerService.hideLoader();
                this.log.e(err);
            });

    }

    public setReputation(value: number) {
        this.star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
        for (let i = 0; i < value + 1; ++i) {
            this.star[i] = "star";
        }
        this.rate = (value + 1) * 100;
    }

    public setReview(url: string, text: string, points: number){
        this.spinnerService.showLoader();
        this.contractManagerService.setReview(url, text, points)
        .then((response) => {
            console.log(response);
            this.setReputation(-1);
            this.openedComments = false;
            this.refresh();
            return;
        }).catch((error) => {
            this.spinnerService.hideLoader();
            console.log(error);
        });
        
    }

    public filterIncompleted(){
        this.filterValue === 0 ? this.filterValue = 2 : this.filterValue = 0;
        this.filterIsIncompleted = !this.filterIsIncompleted;
        if(this.filterIsReviewed){
            this.filterIsReviewed = false;
        }     
        this.openedComments = false;  
        this.refresh();
    }
    
    public filterCompleted(){
        this.filterValue === 1 ? this.filterValue = 2 : this.filterValue = 1;
        this.filterIsReviewed = !this.filterIsReviewed;
        if(this.filterIsIncompleted){
            this.filterIsIncompleted = false;
        }
        this.openedComments = false;  
        this.refresh();
    }

    public filterPending(){
        this.filterIsPending = !this.filterIsPending;
        this.openedComments = false;
        this.refresh();
    }
}
