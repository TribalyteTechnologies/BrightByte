import { Component, Input } from "@angular/core";
import { UserCommit } from "../../models/user-commit.model";
import { CommitComment } from "../../models/commit-comment.model";
import { CommitDetails } from "../../models/commit-details.model";

@Component({
    selector: "commit-card",
    templateUrl: " commit-card.component.html ",
    styles: ["commit-card.component.scss"]
 })

export class CommitCard {

    @Input()
    public commit: UserCommit;
    
    @Input()
    public comments: CommitComment[];

    @Input()
    public details: CommitDetails;
}
