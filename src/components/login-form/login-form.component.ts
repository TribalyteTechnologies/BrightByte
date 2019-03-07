import { Component, Output, EventEmitter } from "@angular/core";
import { NavController , LoadingController} from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";
import { AlertController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { AppVersionService } from "../../core/app-version.service";
import { TabsPage } from "../../pages/tabs/tabs";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { UserDetails } from "../../models/user-details.model";
import { SpinnerService } from "../../core/spinner.service";
import { UserLoggerService } from "../../domain/user-logger.service";
import { Account } from "web3/types";
import { AppConfig } from "../../app.config";
import { MigrationService } from "../../migration/migration.service";

@Component({
    selector: "login-form",
    templateUrl: "login-form.component.html",
    styles: ["login-form.component.scss"]
})

export class LoginForm {

    @Output() 
    public registerEvent = new EventEmitter();

    @Output() 
    public setProfileEvent = new EventEmitter();

    

    public msg: string;
    public text: any;
    public debuggingText: string;
    public isDebugMode = false;
    public appVersion = "DEV";
    public migrationDone = false;
    public isKeepCredentialsOn = false;

    private readonly NEW_USER = "new-user";
    private readonly SET_PROFILE = "set-profile";

    private log: ILogger;
    

    constructor(
        private navCtrl: NavController,
        private translateService: TranslateService,
        private contractManager: ContractManagerService,
        private web3Service: Web3Service,
        private loginService: LoginService,
        private userLoggerService: UserLoggerService,
        private spinnerService: SpinnerService,
        private alertCtrl: AlertController,
        private loadingCtrl: LoadingController,
        private migrationService: MigrationService,
        loggerSrv: LoggerService,
        appVersionSrv: AppVersionService
    ) {
        this.log = loggerSrv.get("LoginPage");
        appVersionSrv.getAppVersion().subscribe(
            ver => this.appVersion = ver,
            err => this.log.w("No app version could be detected")
        );
        
        this.migrationDone = this.userLoggerService.getMigration();
    }

    public ngOnInit(){
        let retrievedUser = this.userLoggerService.retrieveAccount();
        this.text = retrievedUser.user;
        let password = retrievedUser.password;
        if (password){
            this.log.d("User retrieved from localStorage: " + this.text);
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
                this.checkNodesAndOpenHomePage(account, 0).then((result) => {
                    this.spinnerService.hideLoader();
                    if(!result) {
                        this.translateService.get("app.connectionFailure").subscribe(
                            msg => {
                                this.msg = msg;
                            });
                    }
                }).catch((e) => {
                    this.spinnerService.hideLoader();
                    
                    this.translateService.get("app.connectionFailure").subscribe(
                        msg => {
                            this.msg = msg;
                            this.log.e(msg, e);
                        });
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
        this.registerEvent.next(this.NEW_USER);
    }

    public showTerms(){
        let terms = this.alertCtrl.create({
            title: "Terms and Conditions",
            subTitle: "The migration has been successful The migration has been successfulThe mbeen successful",
            buttons: ["Accept"]
        });
        terms.present();
    }

    public migrate(pass){
        let alert = this.alertCtrl.create({
            title: "Migration",
            subTitle: "The migration has been successful",
            buttons: ["Accept"]
        });

        let alertError = this.alertCtrl.create({
            title: "Error",
            subTitle: "The migration has failed",
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
                this.contractManager.init(account, 0)
                    .then(() => {
                        return this.migrationService.initOld(account, 0);
                    }).then((result) => {
                        return this.migrationService.getUserMigration();
                    }).then((result) => {
                        this.migrationDone = true;
                        this.userLoggerService.setMigration();
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
                        alertError.present();
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

    private checkNodesAndOpenHomePage (account: Account, currentNodeIndex: number): Promise<boolean> {
        let prom = Promise.resolve(false);
        if(currentNodeIndex >= 0 && currentNodeIndex < AppConfig.NETWORK_CONFIG.length) {
            prom = this.contractManager.init(account, currentNodeIndex)
            .then(() => {
                this.log.d("Account set. Checking the node number: " + currentNodeIndex);
                return this.contractManager.getUserDetails(account.address);
            }).then((detailsUser: UserDetails) => {
                this.log.d("Email: ", detailsUser.email);
                if (!detailsUser.email) {
                    this.setProfileEvent.next(this.SET_PROFILE);
                } else {
                    this.navCtrl.push(TabsPage);
                }
                this.log.d("Total success connecting the node " + currentNodeIndex);
                return true;
            }).catch((e) => {
                this.log.d("Failure to access the node " + currentNodeIndex);
                return(this.checkNodesAndOpenHomePage(account, currentNodeIndex + 1));
            });
        }
        return prom;
    }
}
