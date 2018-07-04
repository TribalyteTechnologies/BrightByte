import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { NavParams } from "ionic-angular";
import { ContractManagerService } from "../../core/contract-manager.service";
import { default as Web3 } from "web3";
import { TranslateService } from "@ngx-translate/core";

@Component({
	selector: "page-commitdetails",
	templateUrl: "commitdetails.html"
})
export class CommitDetailsPage {
	public web3: Web3;
	public account: any;
	public commitDetails: Array<any>;
	public commitIndex: number;
	public msg: string;
	public commentsArray: string[];
	public date: string;
	private log: ILogger;

	constructor(
		navParams: NavParams,
		public navCtrl: NavController,
		loggerSrv: LoggerService,
		private web3Service: Web3Service,
		public translateService: TranslateService,
		private contractManagerService: ContractManagerService,
		private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = loggerSrv.get("CommitDetailsPage");
		this.account = this.loginService.getAccount();
		this.commitDetails = navParams.get("commitDetails");
		this.commitIndex = navParams.get("commitIndex");
		this.log.d("Details Object: ", this.commitDetails);
		this.log.d("CommitIndex: ", this.commitIndex);
		this.date = new Date((this.commitDetails[2] * 1000)).toLocaleString();

	}
	public ionViewWillEnter() {
		this.contractManagerService.getCommentsOfCommit(this.commitIndex)
			.then((arrayOfComments: string[]) => {
				this.log.d("Array of Comments: ", arrayOfComments);
				this.commentsArray = arrayOfComments;
			}).catch((e) => {
				this.translateService.get("commitDetails.gettingComments").subscribe(
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