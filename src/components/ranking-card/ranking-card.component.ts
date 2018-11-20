import { Component, Input } from "@angular/core";
import { UserDetails } from "../../models/user-details.model";
import { UserReputation } from "../../models/user-reputation.model";


@Component({
    selector: "ranking-card",
    templateUrl: " ranking-card.component.html ",
    styles: ["ranking-card.component.scss"]
 })

export class RankingCard {
    @Input()
    public userDetails: UserDetails;
    
    @Input()
    public ranking: UserReputation;
}
