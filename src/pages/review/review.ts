import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { CommitReviewPage } from "../commitreview/commitreview";
import { default as Web3 } from "web3";
import { TranslateService } from "@ngx-translate/core";
import { Split } from "../../domain/split.service";

@Component({
    selector: "page-review",
    templateUrl: "review.html"
})

export class ReviewPage {
    public web3: Web3;
    public arrayCommits: any;
    public msg: string;
    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        public translateService: TranslateService,
        private web3Service: Web3Service,
        private split: Split,
        private contractManagerService: ContractManagerService,
        loggerSrv: LoggerService
    ) {
        this.web3 = this.web3Service.getWeb3();
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
        let projectAndId = this.split.splitIDAndProject(commit[0]);

        let id = projectAndId[1];
        let project = projectAndId[0];
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
