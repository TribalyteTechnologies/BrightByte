import { Component, Input } from "@angular/core";
import { CommitComment } from "../../models/commit-comment.model";

@Component({
    selector: "review-comment",
    templateUrl: "review-comment.component.html",
    styles: ["review-comment.component.scss"]
 })

export class ReviewCommentComponent {

    @Input()
    public review: CommitComment;


}
