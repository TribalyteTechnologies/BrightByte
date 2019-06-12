import { Component } from "@angular/core";
import { PopoverController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { AppVersionService } from "../../core/app-version.service";
import { UserLoggerService } from "../../domain/user-logger.service";
import { TermsAndConditions } from "../../pages/termsandconditions/termsandconditions";
import { UpdateCheckService } from "../../core/update-check.service";

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
        private appVersionSrv: AppVersionService,
        private versionCheckSrv: UpdateCheckService,
        loggerSrv: LoggerService
        
    ) {
        
        this.log = loggerSrv.get("LoginPage");
        this.migrationDone = this.userLoggerService.getMigration();
        this.versionCheckSrv.startVersionCheckThread();
        this.appVersionSrv.getAppVersion().subscribe(
            ver => this.appVersion = ver,
            err => this.log.w("No app version could be detected")
            );
    }

    public manageEvent(e: string){
        this.loginState = e;
    }

    public showTerms(){
        let popover = this.popoverCtrl.create(TermsAndConditions, {},  {cssClass: "terms-popover"});
        popover.present();
    }
}

