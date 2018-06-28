import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { NavParams } from "ionic-angular";
import { ContractManagerService } from "../../core/contract-manager.service";

@Component({
	selector: "page-commitReview",
	templateUrl: "commitreview.html"
})
export class CommitReviewPage {
	public web3: any;
	public account: any;
	public commitDetails: Object;
	public date: string;
	public indexArray;
	public star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
	public rate = 0;
	public msg: string;
	public isButtonDisabled = false;
	public isButtonBackDisabled = false;
	public msg1: string;
	private log: ILogger;

	constructor(
		public navCtrl: NavController,
		private loggerSrv: LoggerService,
		private web3Service: Web3Service,
		private navParams: NavParams,
		private contractManagerService: ContractManagerService,
		private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("CommitReviewPage");
		this.account = this.loginService.getAccount();
		this.commitDetails = navParams.get("commitDetails");
		this.indexArray = navParams.get("indexArray");
		this.log.d("Details Object: ", this.commitDetails);
		this.date = new Date((this.commitDetails[2] * 1000)).toLocaleString();
	}

	public addReview(textComment) {
		this.isButtonDisabled = true;
		this.isButtonBackDisabled = true;
		if (!textComment) {
			this.msg = "Please, write your review";
			this.isButtonDisabled = false;
			this.isButtonBackDisabled = false;  
		} else {
			this.msg = "";
			this.log.d("index: ", this.indexArray);
			this.contractManagerService.setReview(this.indexArray, textComment, this.rate)
				.then((resolve) => {
					this.log.d("Contract manager response: ", resolve);
					if (resolve.blockNumber > 4929812) {
						this.isButtonBackDisabled = false;
						this.msg1 = "Review successfully done";
					}
				}).catch((e) => {
					this.isButtonBackDisabled =false;
					this.isButtonDisabled = false;
					this.log.e("Transaction Error!!", e);
					this.msg = "Transaction Error!!";
				});
		}
	}
	public setReputation(value) {
		this.star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
		switch (value) {
			case 0: this.star[0] = "star"; this.rate = 100; break;
			case 1: this.star[0] = "star"; this.star[1] = "star"; this.rate = 200; break;
			case 2: this.star[0] = "star"; this.star[1] = "star"; this.star[2] = "star"; this.rate = 300; break;
			case 3: this.star[0] = "star"; this.star[1] = "star"; this.star[2] = "star"; this.star[3] = "star"; this.rate = 400; break;
			case 4: this.star[0] = "star"; this.star[1] = "star"; this.star[2] = "star"; this.star[3] = "star"; this.star[4] = "star"; this.rate = 500; break;
			default: this.star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"]; this.rate = 0; break;
		}
	}
}