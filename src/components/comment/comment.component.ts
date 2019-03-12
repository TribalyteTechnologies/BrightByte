import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommitComment } from "../../models/commit-comment.model";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "comment",
    templateUrl: "comment.component.html",
    styles: ["comment.component.scss"]
 })

export class CommentComponent {

    public ANONYMOUS = "";

    @Output() 
    public thumbsUp = new EventEmitter();

    @Output()
    public thumbsDown = new EventEmitter();

    private _review: CommitComment;
    private _isReview: boolean = true;

    @Input()
    public set isReview(val: boolean){
        this._isReview = val;
    }

    public get isReview(){
        return this._isReview;
    }

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

    public setThumbsUp(){
        this.thumbsUp.next();
    }

    public setThumbsDown(){
        this.thumbsDown.next();
    }

    constructor(public translateService: TranslateService){
        translateService.get("app.anonymous").subscribe(
            msg => {
                this.ANONYMOUS = msg;
            });
    }


}
