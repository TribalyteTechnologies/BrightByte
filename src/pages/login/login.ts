import { Component } from "@angular/core";
import { NavController, LoadingController } from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";
import { AlertController } from "ionic-angular";
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
    public migrationDone = false;
    public isKeepCredentialsOn = false;
    private log: ILogger;

    constructor(
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        private navCtrl: NavController,
        private translateService: TranslateService,
        private contractManager: ContractManagerService,
        private web3Service: Web3Service,
        private loginService: LoginService,
        private userLoggerService: UserLoggerService,
        private spinnerService: SpinnerService,
        loggerSrv: LoggerService,
        appVersionSrv: AppVersionService
    ) {
        this.log = loggerSrv.get("LoginPage");
        appVersionSrv.getAppVersion().subscribe(
            ver => this.appVersion = ver,
            err => this.log.w("No app version could be detected")
        );
        if (localStorage.length > 0) {
            this.migrationDone = Boolean(localStorage.getItem("BrightMigrationDone1"));
        } else {
            this.migrationDone = false;
        }
    }

    public ionViewWillEnter(){
        if (localStorage.length > 0){
            let retrievedUser = this.userLoggerService.retrieveAccount();
            this.text = retrievedUser.user;
            let password = retrievedUser.password;
            if (password){
                this.log.d("User retrieved from localStorage: " + this.text);
                this.login(password);
            }
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
                if (this.isKeepCredentialsOn){
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

    public migration(pass: string){
        let alert = this.alertCtrl.create({
            title: "Migration",
            subTitle: "The migration has been successful",
            buttons: ["Accept"]
        });

        let loader = this.loadingCtrl.create();
        loader.present();
        try {
            this.log.d("File imported: ", this.text);
            if (this.text === undefined) {
                this.log.e("File not loaded");
                this.translateService.get("app.fileNotLoaded").subscribe(
                    msg => {
                        loader.dismiss();
                        this.msg = msg;
                    });
            } else {
                let account = this.web3Service.getWeb3().eth.accounts.decrypt(this.text, pass);
                this.log.d("Imported account from the login file: ", account);
                this.loginService.setAccount(account);
                this.contractManager.init(account)
                    .then(() => {
                        return this.contractManager.getUserMigration();
                    }).then((result) => {
                        this.migrationDone = true;
                        localStorage.setItem("BrightMigrationDone1", "true");
                        loader.dismiss();
                        alert.present();
                    })
                    .catch((e) => {
                        window.alert(e);
                        this.translateService.get("app.noRpc").subscribe(
                            msg => {
                                loader.dismiss();
                                this.msg = msg;
                            });
                        this.log.e("ERROR getting user or checking if this user has already set his profile: ", e);
                        loader.dismiss();
                    });

            }

        } catch (e) {
            this.translateService.get("app.wrongPassword").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                    loader.dismiss();
                });
        }
    }

    public migration2(pass: string){
        let loader = this.loadingCtrl.create();
        loader.present();
        let account1 = this.web3Service.getWeb3().eth.accounts.decrypt(this.text, pass);
        if(account1.address === "0x5b0244CF47f017c69835633D7ac77BbA142D45Ee"){
            try {
                this.log.d("File imported: ", this.text);
                if (this.text === undefined) {
                    this.log.e("File not loaded");
                    this.translateService.get("app.fileNotLoaded").subscribe(
                        msg => {
                            loader.dismiss();
                            this.msg = msg;
                        });
                } else {
                    let account = this.web3Service.getWeb3().eth.accounts.decrypt(this.text, pass);
                    this.log.d("Imported account from the login file: ", account);
                    this.loginService.setAccount(account);
                    this.contractManager.init(account)
                        .then(() => {
                            return this.contractManager.userSecondMigration();
                        }).then((result) => {
                            loader.dismiss();
                        })
                        .catch((e) => {
                            this.translateService.get("app.noRpc").subscribe(
                                msg => {
                                    this.msg = msg;
                                    loader.dismiss();
                                });
                            this.log.e("ERROR getting user or checking if this user has already set his profile: ", e);
                        });
    
                }
    
            } catch (e) {
                window.alert(e);
                this.translateService.get("app.wrongPassword").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                        loader.dismiss();
                    });
            }
        }
        loader.dismiss();
    }
}
