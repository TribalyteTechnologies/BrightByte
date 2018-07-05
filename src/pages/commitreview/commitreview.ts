import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { NavParams } from "ionic-angular";
import { ContractManagerService } from "../../core/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
	selector: "page-commitReview",
	templateUrl: "commitreview.html"
})
export class CommitReviewPage {
	public web3: any;
	public account: any;
	public commitDetails: Object;
	public date: string;
	public isBackButtonDisabled = false;
	public indexArray;
	public star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
	public rate = 0;
	public msg: string;
	public isButtonDisabled = false;
	public msg1: string;
	private project: string;
	private log: ILogger;

	constructor(
		public navCtrl: NavController,
		loggerSrv: LoggerService,
		private web3Service: Web3Service,
		public translateService: TranslateService,
		navParams: NavParams,
		private contractManagerService: ContractManagerService,
		private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = loggerSrv.get("CommitReviewPage");
		this.account = this.loginService.getAccount();
		this.commitDetails = navParams.get("commitDetails");
		this.indexArray = navParams.get("indexArray");
		this.project = navParams.get("commitProject");
		this.log.d("Details Object: ", this.commitDetails);
		this.date = new Date((this.commitDetails[3] * 1000)).toLocaleString();
	}

	public addReview(textComment) {
		this.isButtonDisabled = true;
		this.isBackButtonDisabled = true;
		if (!textComment) {
			this.translateService.get("commitReview.emptyField").subscribe(
				result => {
					this.msg = result;
				},
				err => {
					this.log.e("Error translating string", err);
				});
			this.isButtonDisabled = false;
			this.isBackButtonDisabled = false;
		} else {
			this.msg = "";
			this.log.d("index: ", this.indexArray);
			this.contractManagerService.setReview(this.indexArray, textComment, this.rate)
				.then((resolve) => {
					this.log.d("Contract manager response: ", resolve);
					if (resolve.status == true) {
						this.isBackButtonDisabled = false;
						this.translateService.get("commitReview.reviewDone").subscribe(
							result => {
								this.msg1 = result;
							},
							err => {
								this.log.e("Error translating string", err);
							});
					}
				}).catch((e) => {
					this.isBackButtonDisabled = false;
					this.isButtonDisabled = false;
					this.translateService.get("commitReview.txError").subscribe(
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
	public setReputation(value) {
		this.star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
		switch (value) {
			case 0: this.star[0] = "star"; this.rate = 100; break;
			case 1:
				for (let i = 0; i < 2; i++) {
					this.star[i] = "star";
				}
				this.rate = 200; break;
			case 2:
				for (let i = 0; i < 3; i++) {
					this.star[i] = "star";
				}
				this.rate = 300; break;
			case 3:
				for (let i = 0; i < 4; i++) {
					this.star[i] = "star";
				}
				this.rate = 400; break;
			case 4:
				for (let i = 0; i < 5; i++) {
					this.star[i] = "star";
				}
				this.rate = 500; break;
			default: this.star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"]; this.rate = 0; break;
		}
	}
}