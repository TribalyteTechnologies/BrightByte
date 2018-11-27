import { Component, Input } from "@angular/core";
import { UserCommit } from "../../models/user-commit.model";


@Component({
    selector: "commit-card",
    templateUrl: "commit-card.component.html",
    styles: ["commit-card.component.scss"]
 })
 
export class CommitCard {
    
    @Input()
    public commit: UserCommit;

}
