import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommitComment } from "../../models/commit-comment.model";
import { TranslateService } from "@ngx-translate/core";
import { AlertController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Observable } from "rxjs";
import { AvatarService } from "../../domain/avatar.service";

@Component({
    selector: "comment",
    templateUrl: "comment.component.html",
    styles: ["comment.component.scss"]
 })

export class CommentComponent {

    @Input()
    public set isReviewNeeded(val: boolean){
        this._isReviewNeeded = val;
    }

    @Input()
    public set isReviewPage(val: boolean){
        this._isReviewPage = val;
    }

    @Input()
    public set review(val: CommitComment){
        this._review = val;
    }

    @Output()
    public submitReview = new EventEmitter<Object>();

    @Output() 
    public thumbsUp = new EventEmitter();

    @Output()
    public thumbsDown = new EventEmitter();

    public submitError: string;
    public emptyCommentError: string;
    public emptyRatingError: string;
    public alertClaim: string;
    public claimMsg: string;
    public alertCancel: string;
    public alertAccept: string;
    public points = [0, 0, 0];
    public textComment: string;
    public isSettingReview: boolean;

    private _review: CommitComment;
    private _isReviewPage: boolean = true;
    private _isReviewNeeded: boolean = false;
    private log: ILogger;
    private avatarObs: Observable<string>;

    constructor (
        public translateService: TranslateService,
        private alertCtrl: AlertController,
        private avatarSrv: AvatarService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("CommentComponent");
    }

    public ngOnInit() {
        if(!this._isReviewNeeded) {
            this.avatarObs = this.avatarSrv.getAvatarObs(this.review.user);
        }
        this.translateService.get([
            "review.reviewCommentError",
            "review.reviewEmptyRatingError",
            "alerts.claim",
            "alerts.claimMsg", 
            "alerts.cancel", 
            "alerts.accept"
        ])
        .subscribe(translation => {
            this.emptyCommentError = translation["review.reviewCommentError"];
            this.emptyRatingError = translation["review.reviewEmptyRatingError"];
            this.alertClaim = translation["alerts.claim"];
            this.claimMsg =  translation["alerts.claimMsg"];
            this.alertCancel =  translation["alerts.cancel"];
            this.alertAccept =  translation["alerts.accept"];
        });
    }

    public ngDoCheck(): void {
        this.review = this._review; 
    }

    public get isReviewNeeded(){
        return this._isReviewNeeded;
    }

    public get isReviewPage(){
        return this._isReviewPage;
    }

    public get review(){
        return this._review;
    }

    public setThumbsUp(){
        this.thumbsUp.next();
    }

    public setThumbsDown(){
        this.thumbsDown.next();
    }

    public validateAndSetReview(text: string){
        let isPointsEmpty: boolean;

        isPointsEmpty = this.points.some(val => val === 0);

        if (!text){
            this.submitError = this.emptyCommentError;
        } else if(isPointsEmpty) {
            this.submitError = this.emptyRatingError;
        } else {
            let obj = {txt: text, points: this.points};
            this.isSettingReview = true;
            this.submitReview.next(obj);
        }
    }

    public setComplaint(){

        // TODO: connect with Smart contracts and send the complaint
        let alert = this.alertCtrl.create({
            title: this.alertClaim,
            message: this.claimMsg,
            buttons: [
              {
                text: this.alertCancel,
                role: "cancel",
                handler: () => {
                      this.log.d("Complain cancelled");
                }
              },
              {
                text: this.alertAccept,
                handler: () => {
                    this.log.d("Complain accepted");
                }
              }
            ]
        });
        alert.present();
    } 
}
