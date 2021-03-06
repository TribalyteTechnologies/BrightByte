import { Component, Input } from "@angular/core";
import { UserReputation } from "../../models/user-reputation.model";
import { LoginService } from "../../core/login.service";
import { AvatarService } from "../../domain/avatar.service";
import { Observable } from "rxjs";
import { UserNameService } from "../../domain/user-name.service";


@Component({
    selector: "ranking-card",
    templateUrl: "ranking-card.component.html",
    styles: ["ranking-card.component.scss"]
})
export class RankingCard {

    @Input()
    public globalSelected: boolean;

    @Input()
    public minNumberReview: number;

    @Input()
    public  minNumberCommit: number;

    public userPosition: number;
    public reputation: string;
    public name: string;
    public nameObs: Observable<string>;
    public email: string;
    public numReviews: number;
    public numCommits: number;
    public agreed = 99;
    public stateFinished = false;
    public userHash: string;
    public accountHash: string;
    public engagementIndex: number;
    public engagementIndexString: string;
    public avatarObs: Observable<string>;
    public isRanked = false;
    public tooltipParams: { pendingCommits: number; pendingReviews: number; agreedPercentage: number};
    public commitParams: { numCommits: number; minNumberCommit: number; };
    public reviewParams: { numReviews: number; minNumberReview: number; };
    public isRankedByReviews: boolean;
    public isRankedByCommits: boolean;
    public isCurrentUserName: boolean;

    @Input()
    public set ranking(val: UserReputation) {
        this.reputation = val.reputation.toFixed(2);
        if (val.userHash === this.accountHash) {
            this.nameObs = this.userNameSrv.setUserObs(val.userHash);
            this.isCurrentUserName = true;
        } else {
            this.name = val.name;
            this.isCurrentUserName = false;
        }
        this.email = val.email;
        this.numReviews = val.numberReviewsMade;
        this.numCommits = val.numberCommitsMade,
        this.agreed = val.agreedPercentage;
        this.userPosition = val.userPosition;
        this.userHash = val.userHash;
        this.engagementIndex = val.engagementIndex;
        this.engagementIndexString = this.engagementIndex.toFixed(2);
        this.isRanked = val.isRanked;
        this.refreshTooltips();
    }

    constructor(
        loginService: LoginService,
        private avatarSrv: AvatarService,
        private userNameSrv: UserNameService
    ) {
        let account = loginService.getAccount();
        this.accountHash = account.address;
    }

    public ngOnInit() {
        this.avatarObs = this.avatarSrv.getAvatarObs(this.userHash);
    }

    private refreshTooltips() {
        this.tooltipParams = {
            pendingCommits: Math.max(0, this.minNumberCommit - this.numCommits),
            pendingReviews: Math.max(0, this.minNumberReview - this.numReviews),
            agreedPercentage: this.agreed
        };
        this.commitParams = {
            numCommits: this.numCommits,
            minNumberCommit : this.minNumberCommit 
        };
        this.reviewParams = {
            numReviews: this.numReviews,
            minNumberReview : this.minNumberReview
        };
        this.isRankedByReviews = this.isRanked || this.numReviews >= this.minNumberReview;
        this.isRankedByCommits = this.isRanked || this.numCommits >= this.minNumberCommit;
    }

}
