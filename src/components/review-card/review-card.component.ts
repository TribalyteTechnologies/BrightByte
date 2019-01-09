import { Component, Input } from "@angular/core";
import { UserCommit } from "../../models/user-commit.model";
import { TranslateService } from "@ngx-translate/core";


@Component({
    selector: "review-card",
    templateUrl: "review-card.component.html",
    styles: ["review-card.component.scss"]
 })
export class ReviewCard {

    public ANONYMOUS = "";
    public urlHash: string = "0000";
    public urlLink = "http";
    public numberReviews = 0;
    public currentNumberReviews = 0;
    public title = "No title";
    public project = "No project";
    public score = 0;
    public isReadNeeded = false;
    public creationDateMs = 0;
    public stateFinished = false;
    public reviews = [];
    public reviewers = new Array<String>();
    public pendingReviewers = new Array<string>();

    private _commit: UserCommit;


    @Input()
    set commit(val: UserCommit){
        this._commit = val;
        let split = val.url.split("/");
        this.urlHash = split[6];
        this.currentNumberReviews = val.reviewers[1].length;
        this.numberReviews = val.reviewers[0].length;
        this.pendingReviewers = val.reviewers[0].map(userval =>  (userval.name === "") ? this.ANONYMOUS : userval.name);
        this.reviewers = val.reviewers[1].map(userval =>  (userval.name === "") ? this.ANONYMOUS : userval.name);
        this.title = val.title;
        this.project = val.project;
        this.score = val.score;
        this.isReadNeeded = val.isReadNeeded;
        this.creationDateMs = val.creationDateMs;
        this.urlLink = val.url;
        this.stateFinished = val.currentNumberReviews !== val.numberReviews ? true : false;
    }
    get commit(){
        return this._commit;
    }
    public ngDoCheck() {
        this.commit = this._commit;
    }
    public openUrl(url: string, isReviewParam: boolean){
        let urlToOpen = url;
        if(isReviewParam){
            urlToOpen = "?reviewId=" + encodeURIComponent(url);
        }
        window.open(urlToOpen, "_blank");
    }

    constructor(public translateService: TranslateService){
        translateService.get("app.anonymous").subscribe(
            msg => {
                this.ANONYMOUS = msg;
            });
    }

}
