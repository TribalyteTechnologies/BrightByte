import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { NavParams } from "ionic-angular";
import { ContractManagerService } from "../../core/contract-manager.service";
import { stringify } from "@angular/compiler/src/util";

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
	//public textComment: string;
	public msg: string;
	public isButtonDisabled = false;
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
		this.log.d("Details Object: ",this.commitDetails);
		this.date = new Date((this.commitDetails[2] * 1000)).toLocaleString();
	}

	public addReview(textComment){
		this.isButtonDisabled = true;
		if(textComment == ""){
			this.msg = "Please, write your review";
			this.isButtonDisabled = false;
		}else{
			this.msg = "";
			this.log.d("index: ",this.indexArray);
			this.contractManagerService.setReview(this.indexArray, textComment)
			.then((resolve) => {
				this.log.d("Contract manager response: ", resolve);
				if (resolve.status == true) {
					this.msg1 = "Review done successfully";
				}
			}).catch((e) => {
				this.isButtonDisabled = false;
				this.log.d("Transaction Error!!");
				this.msg = "Transaction Error!!";
			});
		}
	}
}