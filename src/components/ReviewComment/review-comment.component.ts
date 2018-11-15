import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommitComment } from "../../models/commit-comment.model";

@Component({
    selector: "review-comment",
    templateUrl: "review-comment.component.html",
    styles: ["review-comment.component.scss"]
 })

export class ReviewCommentComponent {

    @Input()
    public review: CommitComment;

    @Output() 
    public thumbsUp = new EventEmitter();

    @Output()
    public thumbsDown = new EventEmitter();

    public setThumbsUp(){
        this.thumbsUp.next();
    }
    public setThumbsDown(){
        this.thumbsDown.next();
    }

}
