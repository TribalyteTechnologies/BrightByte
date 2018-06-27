import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { default as Web3 } from "web3";
import { default as contract } from "truffle-contract";
import { HttpClient } from "@angular/common/http";
import { TabsPage } from "../../pages/tabs/tabs";
import { ContractManagerService } from "../../core/contract-manager.service";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
	selector: "page-setprofile",
	templateUrl: "setprofile.html"
})
export class SetProfilePage {
	public web3: Web3;
	public account: any;
	public abi: any;
	public abijson: any;
	public bright: any;
	public myForm: FormGroup;
	public contract: any;
	public msg: string;
	public nonce: string;
	private log: ILogger;

	constructor(
		public navCtrl: NavController,
		private loggerSrv: LoggerService,
		private web3Service: Web3Service,
		public fb: FormBuilder,
		public http: HttpClient,
		private contractManagerService: ContractManagerService,
		private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("SetProfilePage");
		this.account = this.loginService.getAccount();
		this.log.d("Unlocked account: ", this.account);
		this.http.get("../assets/build/Bright.json").subscribe(data => {
			this.abijson = data;
			this.abi = data["abi"];
			this.bright = contract(this.abijson); //TruffleContract function
		}, (err) => this.log.e(err), () => {
			//If you want do after the promise. Code here
			this.log.d("TruffleContract function: ", this.bright);
		});
		this.myForm = this.fb.group({
			name: ['', [Validators.required]],
			email: ['', Validators.compose([Validators.required, Validators.email])]
		});
	}

	public updateProfile(name: string, mail: string) {
		this.contractManagerService.getAllUserEmail()
			.then((resolve) => {
				this.log.d("ARRAY Emails: ", resolve);
				let arrayEmails = resolve;
				let emailUsed = false;
				this.log.d("arrayEmails.length:", arrayEmails.length);
				for (let i = 0; i < arrayEmails.length; i++) {
					if (arrayEmails[i] == mail) {
						emailUsed = true;
					}
				}

				if (!emailUsed) {
					this.contractManagerService.setProfile(name, mail)
						.then((resolve) => {
							this.log.d("Contract manager response: ", resolve);
							if (resolve.status == true) {
								this.navCtrl.push(TabsPage);
							}
						}).catch((e) => {
							this.log.d("Transaction Error!!");
							this.msg = "Transaction Error!!";
						});
				} else {
					this.msg = "Email already in use";
				}
			}).catch((e) => {
				this.log.d("Error getting emails!!", e);
				this.msg = "Error getting emails!!";
			});


	}
}
