import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { CommitReviewPage } from "../commitreview/commitreview";
import { TranslateService } from "@ngx-translate/core";
import { SplitService } from "../../domain/split.service";
import { CommitToReview } from "../../models/commit-to-review.model";

@Component({
    selector: "page-review",
    templateUrl: "review.html"
})

export class ReviewPage {
    public arrayCommits: CommitToReview[];
    public msg: string;
    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        public translateService: TranslateService,
        private splitService: SplitService,
        private contractManagerService: ContractManagerService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ReviewPage");

    }
    public ionViewWillEnter(): void {
        this.contractManagerService.getCommitsToReview()
            .then((arrayOfCommits: CommitToReview[]) => {
                this.log.d("ARRAY Commits: ", arrayOfCommits);
                this.arrayCommits = arrayOfCommits;
            }).catch((e) => {
                this.translateService.get("review.getCommits").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
                return Promise.reject(e);
            });
    }
    public selectUrl(commit: CommitToReview, index: number) {
        let project = this.splitService.getProject(commit.url);
        this.contractManagerService.getDetailsCommits(commit.url)
            .then(detailsCommit => {
                this.log.d("Details commits: ", detailsCommit);
                this.log.d("Index: ", index);
                this.navCtrl.push(CommitReviewPage, {
                    commitDetails: detailsCommit,
                    commitProject: project,
                    indexArray: index
                });
            }).catch((e) => {
                this.translateService.get("review.getDetails").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
                return Promise.reject(e);
            });
    }

}
