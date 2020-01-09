import { Component, Input } from "@angular/core";
import { UserCommit } from "../../models/user-commit.model";
import { TranslateService } from "@ngx-translate/core";
import { FormatUtils } from "../../core/format-utils";
import { AppConfig } from "../../app.config";
import { Observable } from "rxjs";
import { AvatarService } from "../../domain/avatar.service";


@Component({
    selector: "commit-card",
    templateUrl: "commit-card.component.html",
    styles: ["commit-card.component.scss"]
 })
 
export class CommitCard {
    public ANONYMOUS = "";
    public ANONYMOUS_ADDRESS = "0x0";
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
    public reviewersAddress = new Array<string>();
    public reviewersObs = new Array<Observable<string>>();

    @Input()
    public isReviewPage: boolean;
    
    @Input()
    public reviewerAddress: string;
    
    @Input()
    public set commit(val: UserCommit){
        this._commit = val;
        this.urlHash = FormatUtils.getHashFromUrl(val.url);
        this.currentNumberReviews = val.reviewers[1].length;
        this.numberReviews = val.reviewers[0].length;
        let updatedPendingReviewers = val.reviewers[0].map(userval => ((userval.name === "") ? this.ANONYMOUS : userval.name));
        let difference = updatedPendingReviewers.filter(pendingRev => !this.pendingReviewers.some(rev => rev === pendingRev));
        this.pendingReviewers = updatedPendingReviewers;
        this.reviewers = val.reviewers[1].map(userval => ((userval.name === "") ? this.ANONYMOUS : userval.name));
        let searchUser = val.reviewers[1].filter(user => {
            if (this.reviewersObs.length !== this.reviewers.length) {
                if (user.name !== "") {
                    this.reviewersObs.push(this.avatarSrv.getAvatarObs(user.userHash));
                } else {
                    this.reviewersObs.push(this.avatarSrv.getAvatarObs(this.ANONYMOUS_ADDRESS));
                }
            }
            this.init = false;
            return user.userHash === this.reviewerAddress;
        });
        if (difference.length > 0 && !this.init){
            this.reviewersObs.push(this.avatarSrv.getAvatarObs(this.reviewerAddress));
        }

        this.title = val.title;
        this.project = val.project;
        this.isPending = val.isReadNeeded;
        this.score = (this.isReviewPage && !searchUser[0]) ? 0 : val.score;
        this.creationDateMs = val.creationDateMs;
        this.urlLink = val.url;
        this.stateFinished = val.currentNumberReviews !== val.numberReviews ? true : false;
    }
    
    public get commit(){
        return this._commit;
    }

    private readonly REVIEW_QUERY = "?" + AppConfig.UrlKey.REVIEWID + "=";
    private readonly COMMIT_QUERY = "?" + AppConfig.UrlKey.COMMITID + "=";
    private _commit: UserCommit;
    private init = true;

    public constructor(
        public translateService: TranslateService,
        private avatarSrv: AvatarService
        ){
    }

    public ngDoCheck() {
        this.commit = this._commit;
    }
  
    public openUrl(url: string, isCommitParam: boolean, e?: Event){
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
}
