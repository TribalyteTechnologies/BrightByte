import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";

import { NewuserPage } from "../newuser/newuser";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { AppVersionService } from "../../core/app-version.service";
import { TabsPage } from "../../pages/tabs/tabs";
import { SetProfilePage } from "../../pages/setprofile/setprofile";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { UserDetails } from "../../models/user-details.model";
import { SpinnerService } from "../../core/spinner.service";
import { UserLoggerService } from "../../domain/user-logger.service";

@Component({
    selector: "page-login",
    templateUrl: "login.html"
})

export class LoginPage {

    public msg: string;
    public text: any;
    public debuggingText: string;
    public isDebugMode = false;
    public appVersion = "DEV";
    public checkboxSelection = false;
    private log: ILogger;

    constructor(
        private navCtrl: NavController,
        private translateService: TranslateService,
        private contractManager: ContractManagerService,
        private web3Service: Web3Service,
        private loginService: LoginService,
        public userLoggerService: UserLoggerService,
        public spinnerService: SpinnerService,
        loggerSrv: LoggerService,
        appVersionSrv: AppVersionService
    ) {
        this.log = loggerSrv.get("LoginPage");
        appVersionSrv.getAppVersion().subscribe(
            ver => this.appVersion = ver,
            err => this.log.w("No app version could be detected")
        );
    }

    public ionViewWillEnter(){
        if (localStorage.length > 0){
            let retrievedUser = this.userLoggerService.retrieveAccount();
            this.text = JSON.parse(retrievedUser.user);
            let password = retrievedUser.password;
            this.login(password);
        }
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
                    //TODO: extract this to a separate function
                    //And call it with different source of data (file or localStorage)
                    this.debuggingText = String(reader.result);
                    this.text = JSON.parse(String(reader.result));
                };
            } else {   
                this.translateService.get("app.wrongFile").subscribe(
                    msg => {
                        this.msg = msg;
                    });
            } 
    }

    
    public login(pass: string) {
        this.spinnerService.showLoader();
        try {
            this.log.d("File imported: ", this.text);
            if (this.text === undefined) {
                this.log.e("File not loaded");
                this.translateService.get("app.fileNotLoaded").subscribe(
                    msg => {
                        this.msg = msg;
                        this.spinnerService.hideLoader();
                    });
            } else {
                let account = this.web3Service.getWeb3().eth.accounts.decrypt(this.text, pass);
                if (this.checkboxSelection){
                    this.userLoggerService.setAccount(this.text, pass);
                }
                         
                this.log.d("Imported account from the login file: ", account);
                this.loginService.setAccount(account);
                this.contractManager.init(account)
                    .then(() => {
                        this.log.d("Account setted");
                        return this.contractManager.getUserDetails(account.address);
                    }).then((detailsUser: UserDetails) => {
                        this.spinnerService.hideLoader();
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
                                this.spinnerService.hideLoader();
                            });
                        this.log.e("ERROR getting user or checking if this user has already set his profile: ", e);
                    });
            }
        } catch (e) {
            this.translateService.get("app.wrongPassword").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                    this.spinnerService.hideLoader();
                });
        }
    }

    public register() {
        this.navCtrl.push(NewuserPage);
    }
}
