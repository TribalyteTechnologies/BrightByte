import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { NavParams } from "ionic-angular";

@Component({
	selector: "page-commitReview",
	templateUrl: "commitreview.html"
})
export class CommitReviewPage {
	public web3: any;
	public account: any;
	public commitDetails: Object;
	public date: string;
	private log: ILogger;

	constructor(
		public navCtrl: NavController,
		private loggerSrv: LoggerService,
		private web3Service: Web3Service,
		private navParams: NavParams,
		private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("CommitReviewPage");
		this.account = this.loginService.getAccount();
		this.commitDetails = navParams.get("commitDetails");
		this.log.d("Details Object: ",this.commitDetails);
		this.date = new Date((this.commitDetails[2] * 1000)).toLocaleString();

	}

}