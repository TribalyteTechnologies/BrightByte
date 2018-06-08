import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {ILogger, LoggerService} from "../../core/logger.service";
import {Web3Service} from "../../core/web3.service";
import {LoginService} from "../../core/login.service";
import {HttpClient} from '@angular/common/http';
import { default as contract }  from 'truffle-contract';
import Tx from 'ethereumjs-tx';
import { PopoverController } from 'ionic-angular';
import { AddCommitPage } from '../../pages/addcommit/addcommit'

@Component({
	selector: 'page-commits',
	templateUrl: 'commits.html'
})

export class CommitPage {
	private log: ILogger;
    web3: any;
	account: any;
	abijson:any;
	abi:any;
	Bright:any;

	constructor(public popoverCtrl: PopoverController, public navCtrl: NavController, public http: HttpClient, private loggerSrv: LoggerService, private web3Service: Web3Service , private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("CommitsPage");
		this.account = this.loginService.getAccount();
		this.log.d("Cuenta importada correctamente en commits",this.account);
		this.http.get('../assets/build/Bright.json').subscribe(data =>  {
            this.abijson = data;
            this.abi= data['abi'];
            this.Bright = contract(this.abijson)//TruffleContract function
        },(err) => this.log.e(err), () => {
            //If you want do after the promise. Code here
            this.log.d("TruffleContract function: ",this.Bright);
        });
	  }
	  
	  public AddCommit(event){
		let popover = this.popoverCtrl.create(AddCommitPage);
		popover.present({
		  ev: event
		});
	  }

}
