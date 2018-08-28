import { Component } from "@angular/core";
import { NavController, NavParams } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { CommitDetails } from "../../models/commit-details.model";
import { CommitComment } from "../../models/commit-comment.model";

@Component({
    selector: "page-commitReview",
    templateUrl: "commitreview.html"
})
export class CommitReviewPage {
    public commitDetails: CommitDetails;
    public isBackButtonDisabled = false;
    public indexArray;
    public star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
    public rate = 0;
    public msg: string;
    public comments: CommitComment[];
    public url: string;
    public isButtonDisabled = false;
    public msg1: string;
    public project: string;
    public isReviewed: boolean;
    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        loggerSrv: LoggerService,
        public translateService: TranslateService,
        navParams: NavParams,
        private contractManagerService: ContractManagerService
    ) {
        this.log = loggerSrv.get("CommitReviewPage");
        this.commitDetails = navParams.get("commitDetails");
        this.indexArray = navParams.get("indexArray");
        this.url = navParams.get("url");
        this.isReviewed = navParams.get("isReviewed");
        this.comments = navParams.get("comments");
        this.project = navParams.get("commitProject");
        this.log.d("Details Object: ", this.commitDetails);
    }

    public addReview(textComment: string) {
        this.isButtonDisabled = true;
        this.isBackButtonDisabled = true;
        if (!textComment) {
            this.translateService.get("commitReview.emptyField").subscribe(
                msg => {
                    this.msg = msg;
                });
            this.isButtonDisabled = false;
            this.isBackButtonDisabled = false;
        } else {
            this.msg = "";
            this.log.d("index: ", this.indexArray);
            this.contractManagerService.setReview(this.indexArray, textComment, this.rate)
                .then(txResponse => {
                    this.isBackButtonDisabled = false;
                    this.log.d("Contract manager response: ", txResponse);
                    if (txResponse) {
                        this.translateService.get("commitReview.reviewDone")
                            .subscribe(result => this.msg1 = result);
                        this.isReviewed = true;
                    } else {
                        throw "Error: setreview response is undefined";
                    }
                }).catch((e) => {
                    this.isBackButtonDisabled = false;
                    this.isButtonDisabled = false;
                    this.translateService.get("commitReview.txError").subscribe(
                        msg => {
                            this.msg = msg;
                            this.log.e(msg, e);
                        });

                });
        }
    }
    public setReputation(value: number) {
        this.star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
        for (let i = 0; i < value + 1; ++i) {
            this.star[i] = "star";
        }
        this.rate = (value + 1) * 100;
    }
    public ionViewWillEnter(): void {
        this.contractManagerService.reviewChangesCommitFlag(this.url)
            .catch((e) => {
                this.log.e("Error Changing the state of the flag to false", e);
                throw e;
            });

    }
}
