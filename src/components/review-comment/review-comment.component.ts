import { Component, Input } from "@angular/core";
import { CommitComment } from "../../models/commit-comment.model";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "review-comment",
    templateUrl: "review-comment.component.html",
    styles: ["review-comment.component.scss"]
 })

export class ReviewCommentComponent {

    public ANONYMOUS = "";
    private _review: CommitComment;

    @Input()
    public set review(val: CommitComment){
        val.name = (val.name === "") ? this.ANONYMOUS : val.name;
        this._review = val;
    }

    public get review(){
        return this._review;
    }

    public ngDoCheck(): void {
        this.review = this._review;  
    }

    constructor(public translateService: TranslateService){
        translateService.get("app.anonymous").subscribe(
            msg => {
                this.ANONYMOUS = msg;
            });
    }


}
