import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { HttpClient } from "@angular/common/http";
import { default as Web3 } from "web3";
import { ContractManagerService } from "../../core/contract-manager.service";

@Component({
	selector: "page-review",
	templateUrl: "review.html"
})

export class ReviewPage {
	public web3: any;
	public account: any;
	public arrayUrls = new Array<string>();
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
		this.log = this.loggerSrv.get("ReviewPage");
		this.account = this.loginService.getAccount();
		this.contractManagerService.getCommitsToReview()
        .then((resolve)=>{
			this.log.d("ARRAY Commits: ", resolve);
			this.arrayUrls = resolve;
        }).catch((e)=>{
			this.log.d("Error getting commits!!");
			this.msg = "Error getting commits!!";
			return Promise.reject(e);
		});

	}

	public urlSelected(commit){
		let index: number;
		for(let i=0; i<this.arrayUrls.length-1; i++){
			if(this.arrayUrls[i] == commit){
				index = i;
			}
		}
		//TODO: Call contract manager service to execute the function getdetails of the commit to setreview
	}

}
