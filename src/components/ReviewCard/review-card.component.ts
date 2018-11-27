import { Component, Input } from "@angular/core";
import { UserCommit } from "../../models/user-commit.model";


@Component({
    selector: "review-card",
    templateUrl: "review-card.component.html",
    styles: ["review-card.component.scss"]
 })
export class ReviewCard {
    
    @Input()
    public commit: UserCommit;

}
