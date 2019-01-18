import { Component, Input } from "@angular/core";
import { UserReputation } from "../../models/user-reputation.model";
import { LoginService } from "../../core/login.service";
import { TranslateService } from "@ngx-translate/core";


@Component({
    selector: "[ranking-card]",
    templateUrl: "ranking-card.component.html",
    styles: ["ranking-card.component.scss"]
 })
export class RankingCard {

    public ANONYMOUS = "";
    public rankingTitle = ["Baby Coder", "Power Coder", "Ninja Coder", "Jedi coder", "Sith coder", "Squid Coder"];
    public userRank = "Undefined";
    public name = "No name";
    public userPosition = 0;
    public reputation = 0;
    public level = 0;
    public email  = "";
    public numReviews = 0;
    public numCommits = 0;
    public agreed = 99;
    public stateFinished = false;
    public userHash = "";
    public accountHash = "";
    
    @Input()
    public set ranking(val: UserReputation) {
        let rankIdx = val.reputation;
        this.reputation = rankIdx;
        this.userRank = this.rankingTitle[Math.round(rankIdx)];
        this.name = ((val.name === "") ? this.ANONYMOUS : val.name);
        this.level = Math.round(val.reputation * 3);
        this.email = val.email;
        this.numReviews = val.finishedReviews;
        this.numCommits = val.numberOfCommits,
        this.agreed = val.agreedPercentage;
        this.userPosition = val.userPosition;
        this.userHash = val.userHash;
    }

    constructor(loginService: LoginService, public translateService: TranslateService){
        let account = loginService.getAccount();
        this.accountHash = account.address;
        translateService.get("app.anonymous").subscribe(
            msg => {
                this.ANONYMOUS = msg;
            });
    }


}
