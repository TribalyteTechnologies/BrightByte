import { Component } from "@angular/core";
import { NavController, PopoverController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { CommitComment } from "../../models/commit-comment.model";
import { LoginService } from "../../core/login.service";
import { UserCommit } from "../../models/user-commit.model";
import { SpinnerService } from "../../core/spinner.service";
import { SessionStorageService } from "../../core/session-storage.service";
import { TransactionQueueService } from "../../domain/transaction-queue.service";
import { AppConfig } from "../../app.config";
import { Observable } from "rxjs";
import { PopupService } from "../../domain/popup.service";

@Component({
    selector: "page-review",
    templateUrl: "review.html"
})

export class ReviewPage {

    public readonly ALL = "all";
    public readonly INCOMPLETE = "incomplete";
    public readonly COMPLETE = "complete";
    public readonly PENDING = "pending";
    public readonly TRUE_STRING = "true";
    public readonly RELOAD_EVENT = "reload";


    public userAdress: string;
    public displayCommitsToReview: Array<UserCommit>;
    public arrayCommits: Array<UserCommit>;
    public msg: string;
    public projects = new Array<string>();
    public projectSelected = this.ALL;
    public isFeedback = {} as { [key: string]: boolean };

    public disabledInfiniteScroll = false;
    public filterValue = "";
    public filterIsPending = false;
    public filterIsIncompleted = false;
    public filterIsReviewed = false;
    public openedComments = false;
    public needReview = false;
    public isSpinnerLoading: Observable<boolean>;
    public numCriteria = 3;
    public stars = [["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"]
        , ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"]
        , ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"]];
    public rate = [0, 0, 0];
    public name = "";
    public currentCommitName = "";
    public currentCommitEmail = "";
    public userCommitComment: CommitComment[];
    public commitComments: CommitComment[];
    public currentCommit: UserCommit;
    public filterArrayCommits = new Array<UserCommit>();
    public textComment = "";

    public submitError = "";

    private log: ILogger;
    private numberOfReviews = -1;
    private isNewReview = false;
    private loadedCommits: number;
    private maxReviews: number;
    private initializing: boolean;
    private currentReviewFilterState: ReviewStateFilterTypes;

    constructor(
        public popoverCtrl: PopoverController,
        public navCtrl: NavController,
        public translateService: TranslateService,
        public spinnerService: SpinnerService,
        public storageSrv: SessionStorageService,
        private loginService: LoginService,
        private contractManagerService: ContractManagerService,
        private transactionQueueService: TransactionQueueService,
        private popupSrv: PopupService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ReviewPage");
    }

    public ngOnInit() {
        this.filterValue = this.storageSrv.get(AppConfig.StorageKey.REVIEWFILTER);
        switch (this.filterValue)  {
            case this.INCOMPLETE:
                this.currentReviewFilterState = ReviewStateFilterTypes.pending;
                break;
            case this.COMPLETE:
                this.currentReviewFilterState = ReviewStateFilterTypes.finished;
                break;
            default:
                this.currentReviewFilterState = ReviewStateFilterTypes.all;
        }
        this.filterIsPending = this.storageSrv.get(AppConfig.StorageKey.REVIEWPENDINGFILTER) === this.TRUE_STRING;
        this.userAdress = this.loginService.getAccountAddress();
        this.initializing = true;
        this.isSpinnerLoading = this.transactionQueueService.getProcessingStatus();
        this.refresh();
    }

    public refresh(event?) {
        let isReloadEvent = (event && event.type === this.RELOAD_EVENT) || this.projectSelected !== this.ALL;
        this.log.d("Refreshing page");
        if (this.initializing || isReloadEvent) {
            this.spinnerService.showLoader();
        }
        let commits: Array<UserCommit>;
        this.contractManagerService.getReviewCommitsState()
        .then(state => {
            if (!event){
                this.loadedCommits = state[this.currentReviewFilterState];
            }
            if (this.initializing){
                this.initializing = false;
                this.maxReviews = this.loadedCommits;
            }
            return this.contractManagerService.getSeasonCommitsToReview(this.loadedCommits);
        })
        .then((commitConcat: Array<UserCommit>[]) => {
            commits = commitConcat[this.currentReviewFilterState];
            if (this.numberOfReviews !== commitConcat[1].length) {
                if (this.numberOfReviews !== -1) {
                    this.isNewReview = true;
                }
                this.numberOfReviews = commitConcat[1].length;
            }
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
                        com.isReadNeeded = rsp;
                        return com;
                    });
            });
            return Promise.all(commitsPromises);
        }).then((rsp) => {
            commits = rsp;
            this.log.d("Response received: ", rsp);
            if (this.loadedCommits < this.maxReviews) {
                this.displayCommitsToReview.push(...commits);
                if (!isReloadEvent){
                    event.complete();
                }
            } else {
                this.displayCommitsToReview = commits;
            }
            this.disabledInfiniteScroll = this.loadedCommits - AppConfig.COMMITS_BLOCK_SIZE < 0;
            let projects = commits.map(commit => commit.project);
            this.projects = projects.filter((value, index, array) => array.indexOf(value) === index);
            this.loadedCommits -= AppConfig.COMMITS_BLOCK_SIZE;
            return this.contractManagerService.getUserDetails(this.userAdress);
        }).then((ud) => {
            this.name = ud.name;
            this.applyFilters(this.displayCommitsToReview);
            let url = new URLSearchParams(document.location.search);
            if (url.has(AppConfig.UrlKey.REVIEWID)) {
                let decodedUrl = decodeURIComponent(url.get(AppConfig.UrlKey.REVIEWID));
                let filteredCommit = this.filterArrayCommits.filter(c => c.url === decodedUrl);
                this.shouldOpen(filteredCommit[0]);
            }
            let doReload = this.filterArrayCommits.length < AppConfig.COMMITS_BLOCK_SIZE && !this.disabledInfiniteScroll
                && isReloadEvent;
            if (doReload) {
                this.refresh(new Event(this.RELOAD_EVENT));
            }
            if (!doReload || this.maxReviews === 0){
                this.spinnerService.hideLoader();
            }
        }).catch((e) => {
            this.translateService.get("commits.getCommits").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                });
            this.spinnerService.hideLoader();
            throw e;
        });
    }

    public openUrl(url: string) {
        this.popupSrv.openUrlNewTab(url);
    }

    public shouldOpen(commit: UserCommit) {
        if (this.loadedCommits === this.maxReviews) {
            this.spinnerService.showLoader();
        }
        this.contractManagerService.getCommentsOfCommit(commit.url)
        .then((comments: Array<CommitComment>) => {
            this.openedComments = true;
            this.commitComments = comments;
            let allComments = comments;
            this.userCommitComment = allComments.filter((commitUR) => {
                return commitUR.user === this.userAdress;
            });
            let idx = allComments.indexOf(this.userCommitComment[0]);
            if (idx !== -1) {
                allComments.splice(idx, 1);
                this.commitComments = allComments;
                this.needReview = false;
            } else {
                this.commitComments = allComments;
                this.needReview = true;
            }
            this.currentCommit = commit;
            this.openedComments = true;
            this.spinnerService.hideLoader();
            return this.getReviewerName(commit);
        }).then((name) => {
            this.currentCommitName = name[0];
            this.currentCommitEmail = name[1];
            return commit.isReadNeeded ? this.contractManagerService.setFeedback(commit.url) :
                Promise.resolve();
        }).then((val) => {
            commit.isReadNeeded = false;
            this.log.d("Feedback response: " + val);
            let idx = this.filterArrayCommits.indexOf(commit);
            if (idx && this.filterArrayCommits){
                this.filterArrayCommits[idx].isReadNeeded = false;
            }
        }).catch(err => {
            this.spinnerService.hideLoader();
            this.log.e(err);
            throw err;
        });
    }

    public setReputation(value: number, starNum: number) {
        this.stars[starNum] = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
        for (let i = 0; i < value + 1; ++i) {
            this.stars[starNum][i] = "star";
        }
        this.rate[starNum] = (value + 1) * 100;
    }


    public applyFilters(usercommits: Array<UserCommit>) {
        let projectFilter = this.setProjectFilter(usercommits);
        let pendingFilter = this.setPendingFilter(projectFilter);
        this.filterArrayCommits = pendingFilter.sort((c1, c2) => {
            return (c2.creationDateMs - c1.creationDateMs);
        });
    }

    public setFilter(name: string) {
        switch (name) {
            case this.INCOMPLETE:
                this.filterValue === this.INCOMPLETE ? this.filterValue = "" : this.filterValue = this.INCOMPLETE;
                this.applyStateFilter(ReviewStateFilterTypes.pending);
                break;
            case this.COMPLETE:
                this.filterValue === this.COMPLETE ? this.filterValue = "" : this.filterValue = this.COMPLETE;
                this.applyStateFilter(ReviewStateFilterTypes.finished);
                break;
            case this.PENDING:
                this.filterIsPending = !this.filterIsPending;
                this.applyFilters(this.displayCommitsToReview);
                break;
            default:
                this.filterValue = "";
                break;
        }
        this.openedComments = false;
        if (this.filterValue !== null) {
            this.storageSrv.set(AppConfig.StorageKey.REVIEWFILTER, this.filterValue.toString());
            if (this.filterValue === "") {
                this.applyStateFilter(ReviewStateFilterTypes.all);
            }
        }
        this.storageSrv.set(AppConfig.StorageKey.REVIEWPENDINGFILTER, this.filterIsPending.toString());
    }

    public setProject(name: string) {
        this.projectSelected = name;
        this.applyFilters(this.displayCommitsToReview);
        if (this.filterArrayCommits.length < AppConfig.COMMITS_BLOCK_SIZE && !this.disabledInfiniteScroll) {
            this.refresh(new Event(this.RELOAD_EVENT));
        }
    }

    public setStyle(idx: number): string {
        if (idx === this.filterArrayCommits.indexOf(this.currentCommit)) {
            return "item-selected";
        } else {
            return "card-list-item";
        }
    }

    public setReview(urlCom: string, text: string, points: Array<number>) {
        this.transactionQueueService.enqueue(this.contractManagerService.setReview(urlCom, text, points))
        .then((response) => {
            this.log.d("Received response " + points);
            this.log.d("Received response " + response);
            this.needReview = false;
            let commitComment = new CommitComment();
            commitComment.name = this.name;
            commitComment.creationDateMs = Date.now();
            commitComment.text = text;
            commitComment.quality = points[0] / AppConfig.SCORE_DIVISION_FACTOR;
            commitComment.difficulty = points[1] / AppConfig.SCORE_DIVISION_FACTOR;
            commitComment.confidence = points[2] / AppConfig.SCORE_DIVISION_FACTOR;
            commitComment.vote = 0;
            commitComment.lastModificationDateMs = Date.now();
            commitComment.user = this.userAdress;
            this.userCommitComment[0] = commitComment;
            for (let i = 0; i < this.numCriteria; i++) {
                this.setReputation(-1, i);
            }
            this.textComment = "";

            let commitSearch = this.displayCommitsToReview.filter(comm => comm.url === urlCom);
            let commit = commitSearch[0];
            commit.score = points[0] * AppConfig.OPTIMISTIC_SCORE_MULTIPLY_FACTOR;
            commit.lastModificationDateMs = Date.now();
            commit.isReadNeeded = false;
            commit.isPending = false;
            let userDetailsSearch = commit.reviewers[0].filter(user => user.userHash === this.userAdress);
            let userDetails = userDetailsSearch[0];
            commit.reviewers[0].splice
                (commit.reviewers[0].indexOf(userDetails), 1);
            commit.reviewers[1].push(userDetails);
            if (this.filterValue === this.INCOMPLETE) {
                this.filterArrayCommits.splice(this.filterArrayCommits.indexOf(commit), 1);
            }

            let url = new URLSearchParams(document.location.search);
            if (url.has(AppConfig.UrlKey.REVIEWID)) {
                let decodedUrl = decodeURIComponent(url.get(AppConfig.UrlKey.REVIEWID));
                let filteredCommit = this.filterArrayCommits.filter(c => c.url === decodedUrl);
                this.shouldOpen(filteredCommit[0]);
            }
            this.numberOfReviews++;
        }).catch((error) => {
            this.log.e("Catched error " + error);
            throw error;
        });
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

    private setProjectFilter(userCommits: Array<UserCommit>): Array<UserCommit> {
        if (this.projectSelected !== this.ALL) {
            return userCommits.filter(commit => {
                return (commit.project === this.projectSelected);
            });
        } else {
            return userCommits;
        }
    }

    private applyStateFilter(state: ReviewStateFilterTypes): void {
        this.initializing = true;
        this.currentReviewFilterState = state;
        if (this.projectSelected !== this.ALL) {
            this.refresh(new Event(this.RELOAD_EVENT));
        } else {
            this.refresh();
        }
    }

    private setPendingFilter(userCommits: Array<UserCommit>): Array<UserCommit> {
        if (this.filterIsPending) {
            return userCommits.filter(commit => {
                return commit.isReadNeeded;
            });
        } else {
            return userCommits;
        }
    }
}

enum ReviewStateFilterTypes {
    pending = 0,
    finished = 1,
    all = 2
}
