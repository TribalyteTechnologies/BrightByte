import { Component } from "@angular/core";
import { AlertController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { AppVersionService } from "../../core/app-version.service";
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
    public loginState = "login";
    private log: ILogger;


    constructor(
        private userLoggerService: UserLoggerService,
        private alertCtrl: AlertController,
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

    public registerEvent(){
        this.loginState = "new-user";
    }

    public goToLoginEvent(){
        this.loginState = "login";
    }

    public setProfileEvent(){
        this.loginState = "set-profile";
    }

    public showTerms(){
        let terms = this.alertCtrl.create({
            title: "Terms and Conditions",
            subTitle: "The migration has been successful The migration has been successfulThe mbeen successful",
            buttons: ["Accept"]
        });
        terms.present();
    }
}
