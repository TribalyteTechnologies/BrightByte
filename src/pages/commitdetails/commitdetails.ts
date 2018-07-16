import { Component } from "@angular/core";
import { NavController, NavParams } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { SplitService } from "../../domain/split.service";
import { CommitComments } from "../../models/commit-comments.model"; 
import { CommitDetails } from "../../models/commit-details.model";

@Component({
    selector: "page-commitdetails",
    templateUrl: "commitdetails.html"
})
export class CommitDetailsPage {
    public commitDetails: CommitDetails;
    public commitIndex: number;
    public msg: string;
    public isButtonPressArray = new Array<boolean>();
    public commentsArray = new Array<CommitComments>();
    public project: string;
    private log: ILogger;

    constructor(
        navParams: NavParams,
        public navCtrl: NavController,
        loggerSrv: LoggerService,
        private splitService: SplitService,
        public translateService: TranslateService,
        private contractManagerService: ContractManagerService
    ) {
        this.log = loggerSrv.get("CommitDetailsPage");
        this.commitDetails = navParams.get("commitDetails");
        this.project = navParams.get("commitProject");
        this.commitIndex = navParams.get("commitIndex");
        this.log.d("Details Object: ", this.commitDetails);
        this.log.d("CommitIndex: ", this.commitIndex);

    }
    public ionViewWillEnter(): Promise<void> {
        return this.refresh();
    }
    public refresh(): Promise<void> {
        return this.contractManagerService.getCommentsOfCommit(this.commitIndex)
            .then((arrayOfComments: CommitComments[]) => {
                this.log.d("Array of Comments: ", arrayOfComments);
                this.commentsArray = arrayOfComments;
            }).catch((e) => {
                this.translateService.get("commitDetails.gettingComments").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
    }
    public setThumbs(index: number, value: number) {
        this.log.d("Index of the comment: ", index);
        this.log.d("Value: ", value);
        this.log.d("url: ", this.commitDetails.url);
        let id = this.splitService.getId(this.commitDetails.url);
        this.contractManagerService.setThumbReviewForComment(id, index, value)
            .then((txResponse) => {
                this.log.d("Contract manager response: ", txResponse);
                if (txResponse) {
                    this.refresh().then(() => {
                        this.isButtonPressArray[index] = false;
                    });
                } else {
                    throw "Error: commitdetails response is undefine";
                }
            }).catch((e) => {
                this.isButtonPressArray[index] = true;
                this.log.e("Can't set the vote", e);
                this.translateService.get("commitDetails.setThumbs").subscribe(
                    msg => {
                        this.msg = msg;
                    });
            });
    }
}
