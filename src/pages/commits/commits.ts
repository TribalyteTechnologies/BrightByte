import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { HttpClient } from "@angular/common/http";
import { PopoverController } from "ionic-angular";
import { AddCommitPopover } from "../../pages/addcommit/addcommit";
import { default as Web3 } from "web3";
import { ContractManagerService } from "../../core/contract-manager.service";
import { CommitDetailsPage } from "../../pages/commitdetails/commitdetails";
import { TranslateService } from "@ngx-translate/core";

@Component({
	selector: "page-commits",
	templateUrl: "commits.html"
})

export class CommitPage {
	private log: ILogger;
	public web3: Web3;
	public arrayCommits = new Array<string[]>();
	public msg: string;

	constructor(
		public popoverCtrl: PopoverController,
		public navCtrl: NavController,
		public http: HttpClient,
		public translateService: TranslateService,
		private contractManagerService: ContractManagerService,
		loggerSrv: LoggerService,
		private web3Service: Web3Service
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = loggerSrv.get("CommitsPage");

	}


	public openAddCommitDialog() {
		let popover = this.popoverCtrl.create(AddCommitPopover, { cssClass: 'custom-popover' });
		popover.present();
		popover.onDidDismiss(() => {
			this.contractManagerService.getCommits()
				.then((resolve) => {
					this.log.d("ARRAY Commits: ", resolve);
					this.arrayCommits = resolve;
				}).catch((e) => {
					this.translateService.get("commits.getCommits").subscribe(
						result => {
							this.msg = result;
							this.log.e(result, e);
						},
						err => {
							this.log.e("Error translating string", err);
						});
				});
		});
	}
	public selectUrl(commit: Object) {
		let index: number;
		for (let i = 0; i < this.arrayCommits.length; i++) {
			if (this.arrayCommits[i][0] == commit[0]) {
				index = i;
			}
		}  //TODO Use a service to get th id and project from the url
		let urlSplitted = commit[0].split("/");
		let id = urlSplitted[6];
		this.contractManagerService.getDetailsCommits(id)
			.then(details => {
				this.log.d("Details commits: ", details);
				this.log.d("Index of row pressed: ", index);
				this.navCtrl.push(CommitDetailsPage, {
					commitDetails: details,
					commitIndex: index
				});
			}).catch((e) => {
				this.translateService.get("addCommit.commitDetails").subscribe(
					result => {
						this.msg = result;
						this.log.e(result, e);
					},
					err => {
						this.log.e("Error translating string", err);
					});
			});
	}
	public ionViewWillEnter() {
		this.contractManagerService.getCommits()
			.then((arrayOfCommits) => {
				this.log.d("ARRAY Commits: ", arrayOfCommits);
				this.arrayCommits = arrayOfCommits;
			}).catch((e) => {
				this.translateService.get("commits.getCommits").subscribe(
					result => {
						this.msg = result;
						this.log.e(result, e);
					},
					err => {
						this.log.e("Error translating string", err);
					});
			});
	}

}
