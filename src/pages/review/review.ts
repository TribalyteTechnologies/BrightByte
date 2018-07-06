import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { ContractManagerService } from "../../core/contract-manager.service";
import { CommitReviewPage } from "../commitreview/commitreview"
import { default as Web3 } from "web3";
import { TranslateService } from "@ngx-translate/core";

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
		loggerSrv: LoggerService,
		public translateService: TranslateService,
		private web3Service: Web3Service,
		private contractManagerService: ContractManagerService,
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
					result => {
						this.msg = result;
						this.log.e(result, e);
					},
					err => {
						this.log.e("Error translating string", err);
					});
				return Promise.reject(e);
			});
	}
	public selectUrl(commit: Object) {
		let index: number;
		for (let i = 0; i < this.arrayCommits.length; i++) {
			if (this.arrayCommits[i][0] == commit[0]) {
				index = i;
			}
			this.log.d("Array length: ", this.arrayCommits.length);
		}
		let urlSplitted = commit[0].split("/");
		let id = urlSplitted[6];
		let project = urlSplitted[4];
		this.contractManagerService.getDetailsCommits(id)
			.then(details => {
				this.log.d("Details commits: ", details);
				this.log.d("Index: ", index);
				this.navCtrl.push(CommitReviewPage, {
					commitDetails: details,
					commitProject: project,
					indexArray: index
				});
			}).catch((e) => {
				this.translateService.get("review.getDetails").subscribe(
					result => {
						this.msg = result;
						this.log.e(result, e);
					},
					err => {
						this.log.e("Error translating string", err);
					});
				return Promise.reject(e);
			});
	}

}
