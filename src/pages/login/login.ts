import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { TranslateService } from "@ngx-translate/core";

import { NewuserPage } from "../newuser/newuser";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { TabsPage } from "../../pages/tabs/tabs";
import { AppConfig } from "../../app.config";
import { SetProfilePage } from "../../pages/setprofile/setprofile";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { UserDetails } from "../../models/user-details.model";

@Component({
    selector: "page-login",
    templateUrl: "login.html"
})

export class LoginPage {

    public msg: string;
    public text: any;
    public debuggingText: string;
    public isDebugMode: boolean;
    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        public http: HttpClient,
        public translateService: TranslateService,
        loggerSrv: LoggerService,
        private contractManager: ContractManagerService,
        private web3Service: Web3Service,
        private loginService: LoginService
    ) {
        this.log = loggerSrv.get("LoginPage");
        this.isDebugMode = AppConfig.LOG_DEBUG;
    }

    public openFile = (event: Event) => {
        this.log.d("Event: ", event);
        let target = <HTMLInputElement>event.target;
        let uploadedArray = <FileList>target.files;
        this.log.d("Target: ", target);
        let input = uploadedArray[0];
        if (input.type === "application/json") {
            this.msg = "";
            this.log.d("Input: ", input);
            let reader = new FileReader();
            reader.readAsText(input);
            reader.onload = () => {
                this.debuggingText = reader.result;
                this.text = JSON.parse(reader.result);
            };
        } else {
            this.translateService.get("app.wrongFile").subscribe(
                msg => {
                    this.msg = msg;
                });
        }
    }

    public login(pass: string) {
        try {
            this.log.d("File imported: ", this.text);
            if (this.text === undefined) {
                this.log.e("File not loaded");
                this.translateService.get("app.fileNotLoaded").subscribe(
                    msg => {
                        this.msg = msg;
                    });
            } else {
                let account = this.web3Service.getWeb3().eth.accounts.decrypt(this.text, pass);
                this.log.d("Imported account from the login file: ", account);
                this.loginService.setAccount(account);
                this.contractManager.init(account)
                    .then(() => {
                        this.log.d("Account setted");
                        return this.contractManager.getUserDetails(account.address);
                    }).then((detailsUser: UserDetails) => {
                        if (!detailsUser.email) {
                            this.log.d("Email: ", detailsUser.email);
                            this.navCtrl.push(SetProfilePage);
                        } else {
                            this.log.d("Email: ", detailsUser.email);
                            this.navCtrl.push(TabsPage);
                        }
                    }).catch((e) => {
                        this.translateService.get("app.noRpc").subscribe(
                            msg => {
                                this.msg = msg;
                            });
                        this.log.e("ERROR getting user or checking if this user has already set his profile: ", e);
                    });

            }

        } catch (e) {
            this.translateService.get("app.wrongPassword").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                });
        }

    }

    public register() {
        this.navCtrl.push(NewuserPage);
    }

}
