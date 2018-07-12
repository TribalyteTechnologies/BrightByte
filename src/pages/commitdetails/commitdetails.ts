import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { NavParams } from "ionic-angular";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { default as Web3 } from "web3";
import { TranslateService } from "@ngx-translate/core";
import { Split } from "../../domain/split.service";

@Component({
    selector: "page-commitdetails",
    templateUrl: "commitdetails.html"
})
export class CommitDetailsPage {
    public web3: Web3;
    public account: any;
    public commitDetails: Array<any>;
    public commitIndex: number;
    public msg: string;
    public isButtonPressArray = new Array<boolean>();
    public commentsArray: string[];
    public project: string;
    private log: ILogger;

    constructor(
        navParams: NavParams,
        public navCtrl: NavController,
        loggerSrv: LoggerService,
        private web3Service: Web3Service,
        private split: Split,
        public translateService: TranslateService,
        private contractManagerService: ContractManagerService,
        private loginService: LoginService
    ) {
        this.web3 = this.web3Service.getWeb3();
        this.log = loggerSrv.get("CommitDetailsPage");
        this.account = this.loginService.getAccount();
        this.commitDetails = navParams.get("commitDetails");
        this.project = navParams.get("commitProject");
        this.commitIndex = navParams.get("commitIndex");
        this.log.d("Details Object: ", this.commitDetails);
        this.log.d("CommitIndex: ", this.commitIndex);

    }
    public ionViewWillEnter(): Promise<void> {
        return this.refresh();
    }
    public refresh(): Promise<void> {
        return this.contractManagerService.getCommentsOfCommit(this.commitIndex)
            .then((arrayOfComments: string[]) => {
                this.log.d("Array of Comments: ", arrayOfComments);
                this.commentsArray = arrayOfComments;
            }).catch((e) => {
                this.translateService.get("commitDetails.gettingComments").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
    }
    public setThumbs(index: number, value: number) {
        this.log.d("Index of the comment: ", index);
        this.log.d("Value: ", value);
        let projectAndId = this.split.splitIDAndProject(this.commitDetails[0]);
        let id = projectAndId[1];
        this.isButtonPressArray[index] = true;
        this.contractManagerService.setThumb(id, index, value)
            .then((txResponse) => {
                this.log.d("Contract manager response: ", txResponse);
                if (txResponse) {
                    this.refresh().then(() => {
                        this.isButtonPressArray[index] = false;
                    });
                } else {
                    throw "Error: commitdetails response is undefine";
                }
            }).catch((e) => {
                this.isButtonPressArray[index] = true;
                this.log.e("Can't set the vote", e);
                this.translateService.get("commitDetails.setThumbs").subscribe(
                    msg => {
                        this.msg = msg;
                    });
            });
    }
}
