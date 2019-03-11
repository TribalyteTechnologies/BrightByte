import { Component } from "@angular/core";
import { PopoverController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { AppVersionService } from "../../core/app-version.service";
import { UserLoggerService } from "../../domain/user-logger.service";
import { TermsAndConditions } from "../../pages/termsandconditions/termsandconditions";

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
    public loginState = "login";
    private log: ILogger;


    constructor(
        private popoverCtrl: PopoverController,
        private userLoggerService: UserLoggerService,
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

    public manageEvent(e: string){
        this.loginState = e;
    }

    public showTerms(){
        let popover = this.popoverCtrl.create(TermsAndConditions, {},  {cssClass: "terms-popover"});
        popover.present();
    }
}
