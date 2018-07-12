import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { CommitReviewPage } from "../commitreview/commitreview";
import { TranslateService } from "@ngx-translate/core";
import { SplitService } from "../../domain/split.service";

@Component({
    selector: "page-review",
    templateUrl: "review.html"
})

export class ReviewPage {
    public arrayCommits: any;
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
            .then((arrayOfCommits) => {
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
    public selectUrl(commit: Object) {
        let index: number;
        for (let i = 0; i < this.arrayCommits.length; i++) {
            if (this.arrayCommits[i][0] === commit[0]) {
                index = i;
            }
            this.log.d("Array length: ", this.arrayCommits.length);
        }
        let id = this.splitService.getId(commit[0]);
        let project = this.splitService.getProject(commit[0]);
        this.contractManagerService.getDetailsCommits(id)
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
