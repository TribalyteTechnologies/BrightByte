import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { ContractManagerService } from "../../core/contract-manager.service";
import { default as Web3 } from "web3";

@Component({
	selector: "page-ranking",
	templateUrl: "ranking.html"
})
export class RankingPage {
	public web3: Web3;
	public account: any;
	public userDetails = ["","",0,0,0,0];
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
		this.log = this.loggerSrv.get("RankingPage");
		this.account = this.loginService.getAccount();
		this.log.d("Imported account: ",this.account);
	}
	public ionViewWillEnter() {
		//return this.account.then(() => { si falla poner proteccion de promesas como en tiko
		this.log.d("Imported account: ",this.account);

		this.contractManagerService.getUserDetails(this.account.address)
			.then((resolve) => {
				this.log.d("User data obtained: ", resolve);
				this.userDetails = resolve;
			}).catch((e) => {
				this.log.e("Error getting user info!!",e);
				this.msg = "Error getting user info!!";
				//return Promise.reject(e);
			});
	}
}
