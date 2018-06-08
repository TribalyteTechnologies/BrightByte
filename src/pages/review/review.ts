import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {ILogger, LoggerService} from "../../core/logger.service";
import {Web3Service} from "../../core/web3.service";
import {LoginService} from "../../core/login.service";
//import { default as Web3 } from 'web3';
//import { default as contract }  from 'truffle-contract';
//import Tx from 'ethereumjs-tx';
//import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'page-review',
  templateUrl: 'review.html'
})

export class ReviewPage {
    web3: any;
	account: any;
	private log: ILogger;

	constructor(public navCtrl: NavController, private loggerSrv: LoggerService, private web3Service: Web3Service, private loginService: LoginService
	) { 
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("ReviewPage");
		this.account = this.loginService.getAccount();

 	}

}



