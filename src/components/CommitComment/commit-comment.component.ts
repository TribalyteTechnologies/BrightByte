import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommitComment } from "../../models/commit-comment.model";

@Component({
    selector: "commit-comment",
    templateUrl: "commit-comment.component.html",
    styles: ["commit-comment.component.scss"]
 })

export class CommentComponent {

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
