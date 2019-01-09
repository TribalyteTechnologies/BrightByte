import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommitComment } from "../../models/commit-comment.model";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "commit-comment",
    templateUrl: "commit-comment.component.html",
    styles: ["commit-comment.component.scss"]
 })

export class CommentComponent {

    public ANONYMOUS = "";

    @Output() 
    public thumbsUp = new EventEmitter();

    @Output()
    public thumbsDown = new EventEmitter();

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
