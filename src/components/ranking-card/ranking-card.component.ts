import { Component, Input } from "@angular/core";
import { UserReputation } from "../../models/user-reputation.model";


@Component({
    selector: "ranking-card",
    templateUrl: "ranking-card.component.html",
    styles: ["ranking-card.component.scss"]
 })
export class RankingCard {

    public rankingTitle = ["Baby Coder", "Power Coder", "Ninja Coder", "Jedi coder", "Sith coder"];
    public userRank = "Undefined";
    public reputation = 0;
    public level = 0;
    public email  = "";
    public numReviews = 0;
    public numCommits = 0;
    public agreed = 99;
    
    @Input()
    public set ranking(val: UserReputation) {
        let rankIdx = Math.round(val.reputation);
        this.reputation = rankIdx;
        this.userRank = this.rankingTitle[rankIdx];
        this.level = val.reputation * val.numReviews;
        this.email = val.email;
        this.numReviews = val.numReviews;
        this.numCommits = Math.round(Math.random() * 100);
        this.agreed = Math.round(Math.random() * 100);
    }

    constructor(){
        console.log("Ranking Card generated");
    }

}
