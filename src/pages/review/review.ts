import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { CommitComment } from "../../models/commit-comment.model";
import { LoginService } from "../../core/login.service";
import { UserCommit } from "../../models/user-commit.model";
import { SpinnerService } from "../../core/spinner.service";
import { SessionStorageService } from "../../core/session-storage.service";
import { AppConfig } from "../../app.config";

@Component({
    selector: "page-review",
    templateUrl: "review.html"
})

export class ReviewPage {
    
    public readonly ALL = "all";
    public readonly INCOMPLETED = "incompleted";
    public readonly COMPLETED = "completed";
    public displayCommitsToReview: UserCommit[];
    public arrayCommits: UserCommit[];
    public allCommitsArray: UserCommit[];
    public msg: string;
    public projects = new Array<string>();
    public projectSelected = this.ALL;
    public isFeedback = {} as {[key: string]: boolean};

    public filterValue = "";
    public filterIsPending = false;
    public filterIsIncompleted = false;
    public filterIsReviewed = false;
    public openedComments = false;
    public needReview = false;
    public numCriteria = 3;
    public stars = [["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"]
    , ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"]
    , ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"]];
    public rate = [0, 0, 0];
    public name = "";
    public address = "";
    public currentCommitName = "";
    public currentCommitEmail = "";
    public userCommitComment: CommitComment[];
    public commitComments: CommitComment[];
    public currentCommit: UserCommit;
    public filterArrayCommits = new Array<UserCommit>();
    public textComment = "";

    public submitError = "";

    
    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        public translateService: TranslateService,
        public spinnerService: SpinnerService,
        public storageSrv: SessionStorageService,
        private loginService: LoginService,
        private contractManagerService: ContractManagerService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ReviewPage");
        this.filterValue = this.storageSrv.get(AppConfig.StorageKey.REVIEWFILTER);
        this.filterIsPending = this.storageSrv.get(AppConfig.StorageKey.REVIEWPENDINGFILTER) === "true";
        
    }

    public ionViewWillEnter(): void {
        this.refresh();
    }

    public refresh(){
        this.log.d("Refreshing page");
        this.spinnerService.showLoader();
        let commits: UserCommit[];
        let userAdress = this.loginService.getAccount();
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
                        com.isReadNeeded = rsp;
                        return this.contractManagerService.getCommentsOfCommit(com.url);
                    }).then((arrayReviewers) => {
                        arrayReviewers[1].forEach((user) => {
                            com.reviewsAlreadyDone.push(user.user);
                        });
                        return com;
                    });
                });
                return Promise.all(commitsPromises);
            }).then((rsp) => {
                commits = rsp;
                this.log.d("Response received: " + rsp);
                this.displayCommitsToReview = commits;
                let projects = commits.map( commit => commit.project );
                this.projects = projects.filter((value, index , array) => array.indexOf(value) === index);
                this.applyFilters(this.displayCommitsToReview);
                this.spinnerService.hideLoader();
                return this.contractManagerService.getUserDetails(userAdress.address);
            }).then((ud) => {
                this.name = ud.name;
                this.address = userAdress.address;
                let url = new URLSearchParams(document.location.search);
                if(url.has(AppConfig.UrlKey.REVIEWID)){
                    let decodedUrl = decodeURIComponent(url.get(AppConfig.UrlKey.REVIEWID));
                    let filteredCommit = this.filterArrayCommits.filter(c =>  c.url === decodedUrl);
                    this.shouldOpen(filteredCommit[0]);
                }
            }).catch((e) => {
                this.translateService.get("commits.getCommits").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
                this.spinnerService.hideLoader();
            });       
    }

    public openUrl(url: string){
        let urlToOpen = url;
        window.open(urlToOpen, "_blank");
    }

    public shouldOpen(commit: UserCommit) {  
        this.spinnerService.showLoader();
        commit.isReadNeeded = false;
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
                this.spinnerService.hideLoader();
                return this.getReviewerName(commit);
            }).then((name) => {
                this.currentCommitName =  name[0];
                this.currentCommitEmail = name[1];
                return this.contractManagerService.setFeedback(commit.url);
            }).then((val) => {
                this.log.d("Feedback response: " + val);
                let idx = this.filterArrayCommits.indexOf(commit);
                this.filterArrayCommits[idx].isReadNeeded = false;
            }).catch(err => {
                this.spinnerService.hideLoader();
                this.log.e(err);
            });

    }

    public setReputation(value: number, starNum: number) {
        this.stars[starNum] = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
        for (let i = 0; i < value + 1; ++i) {
            this.stars[starNum][i] = "star";
        }
        this.rate[starNum] = (value + 1) * 100;
    }

    public validateAndSetReview(url: string, text: string, points: number[]){
        this.submitError = "";
        let isPointsEmpty = false;

        let zero = function(element){
            return (element === 0);
        };

        isPointsEmpty = points.some(zero);

        if (!text){
            this.obtainTranslatedError("review.reviewCommentError");
        } else if(isPointsEmpty) {
            this.obtainTranslatedError("review.reviewEmptyRatingError");
        } else{
            this.setReview(url, text, points);
        }
    }

    
        
    public applyFilters(usercommits: UserCommit[]) {
        let projectFilter = this.setProjectFilter(usercommits);
        let statusFilter = this.setStatusFilter(projectFilter);
        let pendingFilter = this.setPendingFilter(statusFilter);
        this.filterArrayCommits = pendingFilter.sort((c1, c2) => {
            return (c2.creationDateMs - c1.creationDateMs);
        });
    }

    public setFilter(name: string){
        switch (name) {
            case "incompleted":
                this.filterValue === this.INCOMPLETED ? this.filterValue = "" : this.filterValue = this.INCOMPLETED;
                break;
            case "completed":
                this.filterValue === this.COMPLETED ? this.filterValue = "" : this.filterValue = this.COMPLETED;
                break;
            case "pending":
                this.filterIsPending = !this.filterIsPending;
                break;
            default:
                this.filterValue = "";
                break;
        }
        this.openedComments = false;
        if (this.filterValue !== null){
            this.storageSrv.set(AppConfig.StorageKey.REVIEWFILTER, this.filterValue.toString());
        }
        this.storageSrv.set(AppConfig.StorageKey.REVIEWPENDINGFILTER, this.filterIsPending.toString());
        this.applyFilters(this.displayCommitsToReview);
    }

    public setProject(name: string){
        this.projectSelected = name;
        this.applyFilters(this.displayCommitsToReview);
    }

    public setStyle(idx: number): string{
        if(idx === this.filterArrayCommits.indexOf(this.currentCommit)){
            return "item-selected";
        } else {
            return "card-list-item";
        }
    }

    private setReview(url: string, text: string, points: number[]){
        let point: number[] = points;
        this.spinnerService.showLoader();
        this.contractManagerService.setReview(url, text, points)
        .then((response) => {
            this.log.d("Received response " + point);
            this.log.d("Received response " + response);
            let userAdress = this.loginService.getAccount();
            this.needReview = false;
            this.userCommitComment[0] = new CommitComment();
            this.userCommitComment[0].name = this.name;
            this.userCommitComment[0].creationDateMs = Date.now();
            this.userCommitComment[0].text = text;
            this.userCommitComment[0].cleanCode = point[0] / 100;
            this.userCommitComment[0].difficulty = point[1] / 100;
            this.userCommitComment[0].reviewerExperience = point[2] / 100;
            this.userCommitComment[0].vote = 0;
            this.userCommitComment[0].lastModificationDateMs = Date.now();
            this.userCommitComment[0].user = userAdress.address;
            this.setReputation(-1, 0);
            this.setReputation(-1, 1);
            this.setReputation(-1, 2);
            this.spinnerService.hideLoader();  
            this.textComment  = "";
            this.refresh();
            return;
        }).catch((error) => {
            this.spinnerService.hideLoader();
            this.log.e("Catched error " + error);
        });
    }

    private obtainTranslatedError(translation: string){
        this.translateService.get(translation).subscribe(
            msg => {
                this.submitError = msg;
            });
    }

    private getReviewerName(commit: UserCommit): Promise<Array<string>>{
        let hash = commit.author;
        return this.contractManagerService.getUserDetails(hash)
        .then((user) => {
            return [user.name, user.email];
        }).catch((e) => {
            this.log.e(e);
            return ["Anonymous", "nomail@web.com"];
        });
    }

    private setProjectFilter(usercommits: UserCommit[]): UserCommit[]{
        if (!(this.projectSelected === this.ALL)){
            return usercommits.filter(commit => {
                return (commit.project === this.projectSelected);
            });
        } else {
            return usercommits;
        }
    }
    private setStatusFilter(usercommits: UserCommit[]): UserCommit[]{
        switch(this.filterValue){
            case "incompleted":
                return usercommits.filter(commit => {
                    return (commit.numberReviews !== commit.currentNumberReviews);
                });
            case "completed":
                return usercommits.filter(commit => {
                    return (commit.numberReviews === commit.currentNumberReviews);
                });
            default:
                return usercommits;
        }
    }
    private setPendingFilter(usercommits: UserCommit[]): UserCommit[]{
        if(this.filterIsPending){
            return usercommits.filter(commit => {
                return commit.isReadNeeded;
            });
        } else {
            return usercommits;
        }
    }
}
