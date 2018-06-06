import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {ILogger, LoggerService} from "../../core/logger.service";
import {Web3Service} from "../../core/web3.service";
import {LoginService} from "../../core/login.service";

@Component({
	selector: 'page-ranking',
	templateUrl: 'ranking.html'
})
export class RankingPage {
	web3: any;
	account: any;
	private log: ILogger;

	constructor(public navCtrl: NavController, private loggerSrv: LoggerService, private web3Service: Web3Service, private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("LoginPage");
		this.account = this.loginService.getAccount();

 	}

}
