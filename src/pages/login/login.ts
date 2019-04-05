import { Component } from "@angular/core";
import { PopoverController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { AppVersionService } from "../../core/app-version.service";
import { UserLoggerService } from "../../domain/user-logger.service";
import { TermsAndConditions } from "../../pages/termsandconditions/termsandconditions";
import { LocalStorageService } from "../../core/local-storage.service";
import { AppConfig } from "../../app.config";
import { TranslateService } from "@ngx-translate/core";

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
    private currentVersion: string;
    


    constructor(
        private popoverCtrl: PopoverController,
        private userLoggerService: UserLoggerService,
        loggerSrv: LoggerService,
        appVersionSrv: AppVersionService,
        storageSrv: LocalStorageService,
        public translateService: TranslateService
    ) {
        
        this.log = loggerSrv.get("LoginPage");
        this.currentVersion = storageSrv.get(AppConfig.StorageKey.LOCALSTORAGEVERSION);
        appVersionSrv.getAppVersion().subscribe(
            ver => {
                this.appVersion = ver;
                if (this.appVersion && this.currentVersion && this.appVersion !== this.currentVersion){
                    translateService.get("app.versionOutdated").subscribe(
                        msg => {
                            window.alert(msg);
                            storageSrv.set(AppConfig.StorageKey.LOCALSTORAGEVERSION, this.appVersion);
                            window.location.reload(true);
                        });   
                }else if (!this.currentVersion) {
                    storageSrv.set(AppConfig.StorageKey.LOCALSTORAGEVERSION, this.appVersion);
                }
            },
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

