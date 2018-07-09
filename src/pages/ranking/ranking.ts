import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { default as Web3 } from "web3";
import { TranslateService } from "@ngx-translate/core";

@Component({
	selector: "page-ranking",
	templateUrl: "ranking.html"
})
export class RankingPage {
	public web3: Web3;
	public account: any;
	public userDetails = ["", "", 0, 0, 0, 0];
	public msg: string;
	private log: ILogger;

	constructor(
		public navCtrl: NavController,
		loggerSrv: LoggerService,
		private web3Service: Web3Service,
		public translateService: TranslateService,
		private contractManagerService: ContractManagerService,
		private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = loggerSrv.get("RankingPage");
		this.account = this.loginService.getAccount();
		this.log.d("Imported account: ", this.account);
	}
	public ionViewWillEnter() {
		this.log.d("Imported account: ", this.account);

		this.contractManagerService.getUserDetails(this.account.address)
			.then((resolve) => {
				this.log.d("User data obtained: ", resolve);
				this.userDetails = resolve;
			}).catch((e) => {
				this.translateService.get("ranking.getUserInfo").subscribe(
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
