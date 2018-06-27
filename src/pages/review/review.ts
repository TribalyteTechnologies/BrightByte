import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { ContractManagerService } from "../../core/contract-manager.service";
import { CommitReviewPage } from "../commitreview/commitreview"
import { default as Web3 } from "web3";

@Component({
	selector: "page-review",
	templateUrl: "review.html"
})

export class ReviewPage {
	public web3: Web3;
	public arrayCommits = new Array<string[]>();
	public msg: string;
	private log: ILogger;

	constructor(
		public navCtrl: NavController,
		private loggerSrv: LoggerService,
		private web3Service: Web3Service,
		private contractManagerService: ContractManagerService,
		private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("ReviewPage");

	}
	public ionViewWillEnter() {
		this.contractManagerService.getCommitsToReview()
			.then((resolve) => {
				this.log.d("ARRAY Commits: ", resolve);
				this.arrayCommits = resolve;
			}).catch((e) => {
				this.log.d("Error getting commits!!");
				this.msg = "Error getting commits!!";
				return Promise.reject(e);
			});
	}
	public urlSelected(commit) {
		let index: number;
		for (let i = 0; i < this.arrayCommits.length; i++) {
			if (this.arrayCommits[i][0] == commit[0]) {
				index = i;
			}
			this.log.d("Array length: ", this.arrayCommits.length);
		}
		let urlSplitted = commit[0].split("/");
		let id = urlSplitted[6];
		this.contractManagerService.getDetailsCommits(id)
			.then(details => {
				this.log.d("Details commits: ", details);
				this.log.d("Index: ", index);
				this.navCtrl.push(CommitReviewPage, {
					commitDetails: details,
					indexArray: index
				});
			}).catch((e) => {
				this.log.d("Error getting details!!");
				this.msg = "Error getting details!!";
				return Promise.reject(e);
			});
	}

}
