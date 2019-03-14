import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommitComment } from "../../models/commit-comment.model";
import { TranslateService } from "@ngx-translate/core";
import { AlertController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";

@Component({
    selector: "comment",
    templateUrl: "comment.component.html",
    styles: ["comment.component.scss"]
 })

export class CommentComponent {

    public ANONYMOUS = "";
    public submitError = "";
    public points = [0, 0, 0];
    public textComment: string;
    
    @Output()
    public submitReview = new EventEmitter<any>();

    @Output() 
    public thumbsUp = new EventEmitter();

    @Output()
    public thumbsDown = new EventEmitter();

    private _review: CommitComment;
    private _isReviewPage: boolean = true;
    private _isReviewNeeded: boolean = false;
    private log: ILogger;

    @Input()
    public set isReviewNeeded(val: boolean){
        this._isReviewNeeded = val;
    }

    public get isReviewNeeded(){
        return this._isReviewNeeded;
    }

    @Input()
    public set isReviewPage(val: boolean){
        this._isReviewPage = val;
    }

    public get isReviewPage(){
        return this._isReviewPage;
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

    constructor(public translateService: TranslateService,
                private alertCtrl: AlertController,
                loggerSrv: LoggerService){
        this.log = loggerSrv.get("CommentComponent");
        translateService.get("app.anonymous").subscribe(
            msg => {
                this.ANONYMOUS = msg;
            });
    }

    public validateAndSetReview(text: string){
        this.submitError = "";
        let isPointsEmpty = false;

        isPointsEmpty = this.points.some(val => val === 0);

        if (!text){
            this.obtainTranslatedError("review.reviewCommentError");
        } else if(isPointsEmpty) {
            this.obtainTranslatedError("review.reviewEmptyRatingError");
        } else{
            let obj = {txt: text, points: this.points};

            this.submitReview.next(obj);    
        }
    }

    public setComplain(){
        let alert = this.alertCtrl.create({
            title: this.obtainTransaltion("alerts.claim"),
            message: this.obtainTransaltion("alerts.claimMsg"),
            buttons: [
              {
                text: this.obtainTransaltion("alerts.cancel"),
                role: "cancel",
                handler: () => {
                      this.log.d("Complain cancelled");
                }
              },
              {
                text: this.obtainTransaltion("alerts.accept"),
                handler: () => {
                    this.log.d("Complain accepted");
                }
              }
            ]
        });
        alert.present();
    } 

    private obtainTranslatedError(translation: string){
        this.translateService.get(translation).subscribe(
            msg => {
                this.submitError = msg;
            });
    }

    private obtainTransaltion(translation: string): string{
        let translatedText = "";
        this.translateService.get(translation).subscribe(
            msg => {
                translatedText = msg;
            });
        return translatedText;
    }    
}
