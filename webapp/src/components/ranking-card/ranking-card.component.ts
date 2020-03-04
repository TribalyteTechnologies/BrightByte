import { Component, Input } from "@angular/core";
import { UserReputation } from "../../models/user-reputation.model";
import { LoginService } from "../../core/login.service";
import { TranslateService } from "@ngx-translate/core";
import { AvatarService } from "../../domain/avatar.service";
import { Observable } from "rxjs";
import { UserNameService } from "../../domain/user-name.service";
import { ContractManagerService } from "../../domain/contract-manager.service";


@Component({
    selector: "ranking-card",
    templateUrl: "ranking-card.component.html",
    styles: ["ranking-card.component.scss"]
})
export class RankingCard {

    public ANONYMOUS = "";
    public userPosition = 0;
    public reputation = 0;
    public name: string;
    public nameObs: Observable<string>;
    public email = "";
    public numReviews = 0;
    public numCommits = 0;
    public agreed = 99;
    public stateFinished = false;
    public userHash = "";
    public accountHash = "";
    public engagementIndex = 0;
    public engagementIndexString = "";
    public avatarObs: Observable<string>;
    public isRanked = false;
    public minNumberReview;
    public minNumberCommit;
    public tooltipParams: { pendingCommits: number; pendingReviews: number; agreedPercentage: number};
    public commitParams: { numCommits: number; minNumberCommit: number; };
    public reviewParams: { numReviews: number; minNumberReview: number; };
    public isRankedByReviews: boolean;
    public isRankedByCommits: boolean;
    public isCurrentUserName: boolean;

    @Input()
    public globalSelected: boolean;

    @Input()
    public set ranking(val: UserReputation) {
        let rankIdx = val.reputation;
        this.reputation = rankIdx;
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
        this.engagementIndexString = this.globalSelected ? this.engagementIndex.toFixed(2) : Math.round(this.engagementIndex).toString();
        this.isRanked = val.isRanked;
        this.tooltipParams = {
            pendingCommits: Math.max(0, this.minNumberCommit - this.numCommits),
            pendingReviews: Math.max(0, this.minNumberReview - this.numReviews),
            agreedPercentage: val.agreedPercentage
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

    constructor(
        loginService: LoginService,
        translateSrv: TranslateService,
        private avatarSrv: AvatarService,
        private userNameSrv: UserNameService,
        private contractManagerService: ContractManagerService
    ) {
        let account = loginService.getAccount();
        this.accountHash = account.address;
        translateSrv.get("app.anonymous").subscribe(
            msg => {
                this.ANONYMOUS = msg;
            });
    }

    public ngOnInit() {
        this.avatarObs = this.avatarSrv.getAvatarObs(this.userHash);
        this.contractManagerService.getCurrentSeasonThreshold().then(seasonThreshold => {
            this.minNumberCommit = seasonThreshold[0];
            this.minNumberReview = seasonThreshold[1];
        });
    }

}
