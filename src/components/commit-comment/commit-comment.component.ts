import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommitComment } from "../../models/commit-comment.model";

@Component({
    selector: "commit-comment",
    templateUrl: "commit-comment.component.html",
    styles: ["commit-comment.component.scss"]
 })

export class CommentComponent {

    @Output() 
    public thumbsUp = new EventEmitter();

    @Output()
    public thumbsDown = new EventEmitter();

    private _review: CommitComment;

    @Input()
    set review(val: CommitComment){
        val.name = (val.name === "") ? "NotMigrated" : val.name;
        this._review = val;
    }

    get review(){
        return this._review;
    }

    public ngDoCheck(): void {
        this.review = this._review; 
    }
}
