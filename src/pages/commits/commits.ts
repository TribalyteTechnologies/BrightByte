import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { HttpClient } from "@angular/common/http";
import { PopoverController } from "ionic-angular";
import { AddCommitPopover } from "../../pages/addcommit/addcommit";
import { default as Web3 } from "web3";
import { ContractManagerService } from "../../core/contract-manager.service";

@Component({
	selector: "page-commits",
	templateUrl: "commits.html"
})

export class CommitPage {
	private log: ILogger;
	public web3: Web3;
	public arrayUrls = new Array<string>();
	public msg: string;

	constructor(
		public popoverCtrl: PopoverController,
		public navCtrl: NavController,
		public http: HttpClient,
		private contractManagerService: ContractManagerService,
		private loggerSrv: LoggerService,
		private web3Service: Web3Service
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("CommitsPage");

		this.contractManagerService.getCommits()
			.then((resolve) => {
				this.log.d("ARRAY Commits: ", resolve);
				this.arrayUrls = resolve;
			}).catch((e) => {
				this.log.d("Error getting commits!!");
				this.msg = "Error getting commits!!";
				return Promise.reject(e);
			});

	}

	public openAddCommitDialog() {
		let popover = this.popoverCtrl.create(AddCommitPopover);
		popover.present();
		popover.onDidDismiss(() => {
			this.contractManagerService.getCommits()
				.then((resolve) => {
					this.log.d("ARRAY Commits: ", resolve);
					this.arrayUrls = resolve;
				}).catch((e) => {
					this.log.d("Error getting commits!!", e);
					this.msg = "Error getting commits!!";
				});
		});
	}
	public urlSelected(commit) {
		let index: number;
		for (let i = 0; i < this.arrayUrls.length - 1; i++) {
			if (this.arrayUrls[i] == commit) {
				index = i;
			}
		}
		//TODO: Call contract manager service to execute the function getdetails of the commit
	}

}
