import { Component } from "@angular/core";
import { PopoverController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { AppVersionService } from "../../core/app-version.service";
import { UserLoggerService } from "../../domain/user-logger.service";
import { TermsAndConditions } from "../../pages/termsandconditions/termsandconditions";
import { UpdateCheckService } from "../../core/update-check.service";
import { AppConfig } from "../../app.config";
import { RegisterSlidePopover } from "../../components/register-tutorial-slides/register-tutorial-slide.component";
import { LocalStorageService } from "../../core/local-storage.service";

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
        private storageSrv: LocalStorageService,
        loggerSrv: LoggerService

    ) {

        this.log = loggerSrv.get("LoginPage");
        this.migrationDone = this.userLoggerService.getMigration();
        this.versionCheckSrv.start(AppConfig.UPDATE_CHECK_INTERVAL_MINS);
        this.appVersionSrv.getAppVersion().subscribe(
            ver => this.appVersion = ver,
            err => this.log.w("No app version could be detected")
        );
        if(!this.storageSrv.get(AppConfig.StorageKey.REGISTERTUTORIALVISITED) && !this.storageSrv.get(AppConfig.StorageKey.LASTPAGE)) {
            this.showRegisterTutorialSlide();
        }
    }

    public manageEvent(e: string) {
        this.loginState = e;
    }

    public showTerms() {
        let popover = this.popoverCtrl.create(TermsAndConditions, {}, { cssClass: "terms-popover" });
        popover.present();
    }

    public showRegisterTutorialSlide() {
        let popover = this.popoverCtrl.create(RegisterSlidePopover, {}, { cssClass: "tutorial-slide" });
        popover.present();
    }
}

