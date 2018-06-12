import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import {ILogger, LoggerService} from "../../core/logger.service";
import {Web3Service} from "../../core/web3.service";
import {LoginService} from "../../core/login.service";
import {HttpClient} from "@angular/common/http";
import { default as contract }  from "truffle-contract";
import Tx from "ethereumjs-tx";
import { PopoverController } from "ionic-angular";
import { AddCommitPopover } from "../../pages/addcommit/addcommit";
import { AppConfig } from "../../app.config";
import { default as Web3 } from "web3";

@Component({
	selector: "page-commits",
	templateUrl: "commits.html"
})

export class CommitPage {
	private log: ILogger;
    public web3: Web3;
	public account: any;
	public abijson:any;
	public abi:any;
	public bright:any;
	public contract:any;
	public contractAddress:any;
	public numberUserCommits = 0;
	public arrayUrls = new Array<string>();

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
			this.bright = contract(this.abijson)//TruffleContract function

			this.log.d("TruffleContract function: ",this.bright);
			this.contractAddress = this.bright.networks[AppConfig.NET_ID].address;
			this.contract = new this.web3.eth.Contract(this.abi,this.contractAddress, {
				from: this.account.address, 
				gas:AppConfig.GAS_LIMIT, 
				gasPrice:AppConfig.GASPRICE, 
				data: this.bright.deployedBytecode
			});
			return this.contract.methods.getNumberUserCommits().call();
		}).then(result => {
			this.numberUserCommits = result;
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
	
	public openAddCommitDialog(){
		let popover = this.popoverCtrl.create(AddCommitPopover);
		popover.present();
		popover.onDidDismiss(data =>{
			this.contract.methods.getNumberUserCommits().call()
			.then(result => {
			this.numberUserCommits = result;
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
			document.getElementById("urlArray").innerHTML = txt; 
			});
		});
	}


}
