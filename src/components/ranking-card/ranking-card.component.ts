import { Component, Input } from "@angular/core";
import { UserReputation } from "../../models/user-reputation.model";
import { LoginService } from "../../core/login.service";


@Component({
    selector: "ranking-card",
    templateUrl: "ranking-card.component.html",
    styles: ["ranking-card.component.scss"]
 })
export class RankingCard {

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
        this.name = val.name;
        this.level = Math.round(val.reputation * 3);
        this.email = val.email;
        this.numReviews = val.finishedReviews;
        this.numCommits = val.numberOfCommits,
        this.agreed = val.agreedPercentage;
        this.userPosition = val.userPosition;
        this.userHash = val.userHash;
    }

    constructor(private loginService: LoginService){
        let account = this.loginService.getAccount();
        this.accountHash = account.address;
    }

}
