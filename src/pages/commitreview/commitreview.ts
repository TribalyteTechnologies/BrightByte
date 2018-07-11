import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { NavParams } from "ionic-angular";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "page-commitReview",
    templateUrl: "commitreview.html"
})
export class CommitReviewPage {
    public web3: any;
    public account: any;
    public commitDetails: Object;
    public isBackButtonDisabled = false;
    public indexArray;
    public star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
    public rate = 0;
    public msg: string;
    public isButtonDisabled = false;
    public msg1: string;
    public project: string;
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
    }

    public addReview(textComment) {
        this.isButtonDisabled = true;
        this.isBackButtonDisabled = true;
        if (!textComment) {
            this.translateService.get("commitReview.emptyField").subscribe(
                msg => {
                    this.msg = msg;
                });
            this.isButtonDisabled = false;
            this.isBackButtonDisabled = false;
        } else {
            this.msg = "";
            this.log.d("index: ", this.indexArray);
            this.contractManagerService.setReview(this.indexArray, textComment, this.rate)
                .then(txResponse => {
                    this.isBackButtonDisabled = false;
                    this.log.d("Contract manager response: ", txResponse);
                    if (txResponse) {
                        this.translateService.get("commitReview.reviewDone")
                            .subscribe(result => this.msg1 = result);
                    } else {
                        throw "Error: setreview response is undefined";
                    }
                }).catch((e) => {
                    this.isBackButtonDisabled = false;
                    this.isButtonDisabled = false;
                    this.translateService.get("commitReview.txError").subscribe(
                        msg => {
                            this.msg = msg;
                            this.log.e(msg, e);
                        });

                });
        }
    }
    public setReputation(value) {
        this.star = ["star-outline", "star-outline", "star-outline", "star-outline", "star-outline"];
        for (let i = 0; i < value + 1; ++i) {
            this.star[i] = "star";
        }
        this.rate = (value + 1) * 100;
    }
}