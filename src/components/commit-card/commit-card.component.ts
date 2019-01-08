import { Component, Input } from "@angular/core";
import { UserCommit } from "../../models/user-commit.model";
import { UserDetails } from "../../models/user-details.model";


@Component({
    selector: "commit-card",
    templateUrl: "commit-card.component.html",
    styles: ["commit-card.component.scss"]
 })
 
export class CommitCard {
    public readonly NOTMIGRATED = "NotMigrated";
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
    public reviewers = new Array<Array<UserDetails>>();
    public pendingReviewers = new Array<string>();


    private _commit: UserCommit;

    @Input()
    public set commit(val: UserCommit){
        this._commit = val;
        let split = val.url.split("/");
        this.urlHash = split[6];
        this.currentNumberReviews = val.reviewers[1].length;
        this.numberReviews = val.reviewers[0].length;
        this.pendingReviewers = val.reviewers[0].map(userval => (userval.name === "") ? this.NOTMIGRATED : userval.name);
        this.reviewers = val.reviewers;
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
  
    public openUrl(url: string, isCommitParam: boolean){
        let urlToOpen = url;
        if(isCommitParam){
            urlToOpen = "?commitId=" + encodeURIComponent(url);
        }
        window.open(urlToOpen, "_blank");
        
    }

}
