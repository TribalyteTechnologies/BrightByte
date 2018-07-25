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
    public arrayCommits: CommitToReview[];
    public msg: string;
    public isFeedback = new Array<boolean>();
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
        this.contractManagerService.getCommitsToReview()
            .then((arrayOfCommits: CommitToReview[]) => {
                this.log.d("ARRAY Commits: ", arrayOfCommits);
                this.arrayCommits = arrayOfCommits;
                let promises = new Array<Promise<void>>();
                for (let j = 0; j < arrayOfCommits.length; j++) {
                    let promise = this.contractManagerService.getFeedback(arrayOfCommits[j].url)
                        .then((arrayOfBooleans: boolean[]) => {
                            this.log.d("ArrayBooleans: ", arrayOfBooleans);
                            for (let i = 0; i < arrayOfBooleans.length; i++) {
                                this.isFeedback[j] = false;
                                if (arrayOfBooleans[i] === true) {
                                    this.isFeedback[j] = true;
                                }
                            }

                        }).catch((e) => {
                            this.translateService.get("review.getCommits").subscribe(
                                msg => {
                                    this.msg = msg;
                                    this.log.e(msg, e);
                                });
                            return Promise.reject(e);
                        });
                    promises.push(promise);
                }
                return Promise.all(promises);
            }).catch((e) => {
                this.translateService.get("review.getCommits").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
                return Promise.reject(e);
            });
    }
    public selectUrl(commit: CommitToReview, index: number) {
        let project = this.splitService.getProject(commit.url);
        let detailCommit;
        this.contractManagerService.getDetailsCommits(commit.url)
            .then((detailsCommit: CommitDetails) => {
                detailCommit = detailsCommit;
                this.log.d("Details commits: ", detailsCommit);
                this.log.d("Index: ", index);
                this.isFeedback[index] = false;
                return this.contractManagerService.getCommentsOfCommit(commit.url);
            }).catch((e) => {
                this.translateService.get("review.getDetails").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            }).then((arrayOfComments: CommitComment[]) => {
                let isReviewed = false;
                let comment: CommitComment;
                for (let i = 0; i < arrayOfComments.length; i++) {
                    if (arrayOfComments[i].user === this.loginService.getAccount().address) {
                        isReviewed = true;
                        comment = arrayOfComments[i];
                    }
                }
                this.log.d("Comment: ", comment);
                this.navCtrl.push(CommitReviewPage, {
                    commitDetails: detailCommit,
                    commitProject: project,
                    indexArray: index,
                    url: commit.url,
                    isReviewed: isReviewed,
                    comment: comment
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
