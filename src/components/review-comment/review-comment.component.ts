import { Component, Input } from "@angular/core";
import { CommitComment } from "../../models/commit-comment.model";

@Component({
    selector: "review-comment",
    templateUrl: "review-comment.component.html",
    styles: ["review-comment.component.scss"]
 })

export class ReviewCommentComponent {

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
