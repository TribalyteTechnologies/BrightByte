import { Component, Input } from "@angular/core";
import { UserCommit } from "../../models/user-commit.model";
import { TranslateService } from "@ngx-translate/core";
import { FormatUtils } from "../../core/format-utils";


@Component({
    selector: "commit-card",
    templateUrl: "commit-card.component.html",
    styles: ["commit-card.component.scss"]
 })
 
export class CommitCard {
    public ANONYMOUS = "";
    public urlHash: string = "0000";
    public urlLink = "http";
    public numberReviews = 0;
    public currentNumberReviews = 0;
    public title = "No title";
    public project = "No project";
    public score = 0;
    public isPending = false;
    public creationDateMs = 0;
    public stateFinished = false;
    public reviewers = new Array<string>();
    public pendingReviewers = new Array<string>();

    @Input()
    public isReviewPage: boolean;

    private readonly REVIEW_QUERY = "?reviewId=";
    private readonly COMMIT_QUERY = "?commitId=";
    private _commit: UserCommit;

    @Input()
    public set commit(val: UserCommit){
        this._commit = val;
        this.urlHash = FormatUtils.getHashFromUrl(val.url);
        this.currentNumberReviews = val.reviewers[1].length;
        this.numberReviews = val.reviewers[0].length;
        this.pendingReviewers = val.reviewers[0].map(userval => ((userval.name === "") ? this.ANONYMOUS : userval.name));
        this.reviewers = val.reviewers[1].map(userval => ((userval.name === "") ? this.ANONYMOUS : userval.name));
        this.title = val.title;
        this.project = val.project;
        this.isPending = val.isReadNeeded;
        this.score = val.score;
        this.creationDateMs = val.creationDateMs;
        this.urlLink = val.url;
        this.stateFinished = val.currentNumberReviews !== val.numberReviews ? true : false;
    }
    public get commit(){
        return this._commit;
    }
    public ngDoCheck() {
        this.commit = this._commit;
    }
  
    public openUrl(url: string, isCommitParam: boolean, e: Event){
        let currentPage = this.isReviewPage ? this.REVIEW_QUERY : this.COMMIT_QUERY;
        let urlToOpen = url;
        if(isCommitParam){
            window.open(urlToOpen, "_blank");
            urlToOpen = currentPage + encodeURIComponent(url);
        }
        window.open(urlToOpen, "_blank");
        if(e){
            e.stopPropagation();
        }
    }

    constructor(public translateService: TranslateService){
        translateService.get("app.anonymous").subscribe(
            msg => {
                this.ANONYMOUS = msg;
            });
        
    }

}
