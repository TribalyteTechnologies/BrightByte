import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {ILogger, LoggerService} from "../../core/logger.service";
import {Web3Service} from "../../core/web3.service";
import {LoginService} from "../../core/login.service";
import {HttpClient} from '@angular/common/http';
import { default as contract }  from 'truffle-contract';
import Tx from 'ethereumjs-tx';
import { PopoverController } from 'ionic-angular';
import { AddCommitPage } from '../../pages/addcommit/addcommit';
import { AppConfig } from "../../app.config";

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
	contract:any;
	contractAddress:any;
	numberUserCommits = 0;
	arrayUrls = new Array<string>();

	constructor(
		public popoverCtrl: PopoverController,
		public navCtrl: NavController,
		public http: HttpClient,
		private loggerSrv: LoggerService,
		private web3Service: Web3Service,
		private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("CommitsPage");
		this.account = this.loginService.getAccount();
		this.log.d("Cuenta importada correctamente en commits",this.account);
		this.http.get("../assets/build/Bright.json").toPromise()
		.then(data => {
            this.abijson = data;
            this.abi= data["abi"];
			this.Bright = contract(this.abijson)//TruffleContract function

			this.log.d("TruffleContract function: ",this.Bright);
			this.contractAddress = this.Bright.networks[AppConfig.NET_ID].address;
			this.contract = new this.web3.eth.Contract(this.abi,this.contractAddress, {from: this.account.address, gas:AppConfig.GAS_LIMIT, gasPrice:AppConfig.GASPRICE, data: this.Bright.deployedBytecode});
			return this.contract.methods.getNumberUserCommits().call();
		}).then(result => {
			this.numberUserCommits = result;
			this.log.d("AQUI SI QUE ENTRAA",result);
			let promises = new Array<Promise<string>>();
			for(let i = 0; i < this.numberUserCommits; i++){
				let promise = this.contract.methods.getUserCommits(i + 1).call();
				promises.push(promise);
			}
			return Promise.all(promises);				
		}).then(urlList => {
			this.arrayUrls = urlList;
			this.log.d("ARRAY",this.arrayUrls);
			let txt: string="";
			for (let x=0;x< this.arrayUrls.length;x++){
				txt+= this.arrayUrls[x]+" <br>";
			}
			document.getElementById("urlArray").innerHTML=  txt; 

		}).catch(err => {
			this.log.e("Error calling BrightByte smart contract :",err);
		})		  

	}
	  
	public addCommit(event){
		let popover = this.popoverCtrl.create(AddCommitPage);
		popover.present({
			ev: event
		});
	}

}
