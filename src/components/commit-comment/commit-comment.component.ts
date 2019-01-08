import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommitComment } from "../../models/commit-comment.model";

@Component({
    selector: "commit-comment",
    templateUrl: "commit-comment.component.html",
    styles: ["commit-comment.component.scss"]
 })

export class CommentComponent {

    public readonly NOTMIGRATED = "NotMigrated";

    @Output() 
    public thumbsUp = new EventEmitter();

    @Output()
    public thumbsDown = new EventEmitter();

    private _review: CommitComment;

    @Input()
    public set review(val: CommitComment){
        val.name = (val.name === "") ? this.NOTMIGRATED : val.name;
        this._review = val;
    }

    public get review(){
        return this._review;
    }

    public ngDoCheck(): void {
        this.review = this._review; 
    }
}
