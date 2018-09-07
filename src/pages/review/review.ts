import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { CommitReviewPage } from "../commitreview/commitreview";
import { TranslateService } from "@ngx-translate/core";
import { SplitService } from "../../domain/split.service";
import { CommitToReview } from "../../models/commit-to-review.model";
import { CommitComment } from "../../models/commit-comment.model";
import { LoginService } from "../../core/login.service";
import { CommitDetails } from "../../models/commit-details.model";

@Component({
    selector: "page-review",
    templateUrl: "review.html"
})

export class ReviewPage {
    
    public readonly ALL = "all";

    public displayCommitsToReview: Array<CommitToReview>;
    public msg = "";
    public projects = new Array<string>();
    public projectSelected = this.ALL;
    public isFeedback = {} as {[key: string]: boolean};
    
    private blkchCommitsToReview: Array<CommitToReview>;
    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        public translateService: TranslateService,
        private splitService: SplitService,
        private loginService: LoginService,
        private contractManagerService: ContractManagerService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ReviewPage");
    }

    public ionViewWillEnter(): void {
        this.refresh();
    }

    public refresh(): Promise<any> {
        return this.contractManagerService.getCommitsToReview()
        .then((commits: CommitToReview[]) => {
            this.blkchCommitsToReview = commits;
            this.log.d("Blockchain commits to review: ", commits);
            this.projects = new Array<string>();
            this.displayCommitsToReview = new Array<CommitToReview>();
            let feedbackPromises = new Array<Promise<boolean[]>>();
            for (let commit of commits) {
                let commitProject = commit.project;
                if (this.projects.indexOf(commitProject) < 0) {
                    this.projects.push(commitProject);
                }
                if (this.projectSelected === this.ALL || this.projectSelected === commitProject){
                    this.displayCommitsToReview.push(commit);
                    this.isFeedback[commit.url] = false;
                    let feedbackProm = this.contractManagerService.getFeedback(commit.url)
                    .then((notifyArray: boolean[]) => {
                        this.log.d("Array of bells: ", notifyArray);
                        for (let i = 0; i < notifyArray.length; i++) {
                            if (notifyArray[i]) {
                                this.isFeedback[commit.url] = true;
                            }
                        }
                        return notifyArray;
                    });
                    feedbackPromises.push(feedbackProm);
                }
            }
            this.log.d("Diferent projects found: ", this.projects);
            this.displayCommitsToReview.sort((c1, c2) => {
                return c2.creationDateMs - c1.creationDateMs;
            });
            return Promise.all(feedbackPromises).then(() => this.displayCommitsToReview);
        }).catch((e) => {
            this.translateService.get("review.getCommits").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                });
        });
    }

    public setReviewFilter(filterId: number) {
        let filterProm = this.refresh();
        switch (filterId) {
            case 0:
            this.log.d("Filter: pending");
                filterProm = filterProm.then((displayCommitsToReview: CommitToReview[]) => {
                    return displayCommitsToReview.filter(
                        commit => this.isFeedback[commit.url]
                    );
                });
                break;
            case 1:
                this.log.d("Filter: not pending");
                filterProm = filterProm.then((displayCommitsToReview: CommitToReview[]) => {
                    return displayCommitsToReview.filter(
                        commit => !this.isFeedback[commit.url]
                    );
                })
                break;
            default:
                this.log.d("Default filter: all");
                break;
        }
        filterProm.then(filteredCommits => {
            this.displayCommitsToReview = filteredCommits;
            this.log.d("Filtered array: ", this.displayCommitsToReview);
        }).catch((e) => {
            this.translateService.get("commits.getCommitsPending").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                });
        });
    }
    
    public selectCommit(commit: CommitToReview) {
        let indx: number;
        for(let i = 0; i < this.blkchCommitsToReview.length; i++){
            if(this.blkchCommitsToReview[i].url === commit.url){
                indx = i;
                break;
            }
        }
        this.log.d("Blockchain index of the commit: ", indx);
        let project = this.splitService.getProject(commit.url);
        let commitDetails: CommitDetails;
        this.contractManagerService.getDetailsCommits(commit.url)
        .then((detailsCommit: CommitDetails) => {
            commitDetails = detailsCommit;
            this.log.d("Details commits: ", detailsCommit);
            this.isFeedback[commitDetails.url] = false;
            return this.contractManagerService.getCommentsOfCommit(commit.url);
        }).catch((e) => {
            this.translateService.get("review.getDetails").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                });
            return Promise.reject(e);
        }).then((arrayOfComments: CommitComment[]) => {
            let isReviewed = false;
            for (let i = 0; i < arrayOfComments.length; i++) {
                if (arrayOfComments[i].user === this.loginService.getAccount().address) {
                    isReviewed = true;
                    break;
                }
            }
            this.navCtrl.push(CommitReviewPage, {
                commitDetails: commitDetails,
                commitProject: project,
                indexArray: indx,
                url: commit.url,
                isReviewed: isReviewed,
                comments: arrayOfComments
            });
        }).catch((e) => {
            this.translateService.get("commitDetails.gettingComments").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                });
            return Promise.reject(e);
        });
    }

}
