import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
	selector: "page-home",
	templateUrl: "home.html"
})
export class HomePage {
	public web3: any;
	public account: any;
	private log: ILogger;

	constructor(
		public navCtrl: NavController,
		loggerSrv: LoggerService,
		private web3Service: Web3Service,
		public translateService: TranslateService,
		private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = loggerSrv.get("HomePage");
		this.account = this.loginService.getAccount();
		this.log.d("Home: ", this.account);
	}

}
