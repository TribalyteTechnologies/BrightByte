import { Component } from "@angular/core";
import { PopoverController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { AppVersionService } from "../../core/app-version.service";
import { UserLoggerService } from "../../domain/user-logger.service";
import { TermsAndConditions } from "../../pages/termsandconditions/termsandconditions";
import { AppConfig } from "../../app.config";
import { RegisterSlidePopover } from "../../components/register-tutorial-slides/register-tutorial-slide.component";
import { LocalStorageService } from "../../core/local-storage.service";
import { PopupService } from "../../domain/popup.service";
import { TranslateService } from "@ngx-translate/core";
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
    public userEmail: string;
    public userName: string;

    private readonly WARNING_KEY = "alerts.warning";
    private readonly NOT_FOR_MOBILE_KEY = "alerts.notForMobileDevice";

    private log: ILogger;

    constructor(
        private popoverCtrl: PopoverController,
        private userLoggerService: UserLoggerService,
        private appVersionSrv: AppVersionService,
        private storageSrv: LocalStorageService,
        private popupSrv: PopupService,
        private translateSrv: TranslateService,
        private versionCheckSrv: UpdateCheckService,
        loggerSrv: LoggerService

    ) {
        this.checkMobileBrowser();
        this.log = loggerSrv.get("LoginPage");
        this.migrationDone = this.userLoggerService.getMigration();
        this.versionCheckSrv.start();
        this.appVersionSrv.getAppVersion().subscribe(
            ver => this.appVersion = ver,
            err => this.log.w("No app version could be detected")
        );
    }

    public ngOnInit() {
        if(!this.storageSrv.get(AppConfig.StorageKey.REGISTERTUTORIALVISITED)) {
            this.showRegisterTutorialSlide();
        }
    }

    public manageEvent(e: string) {
        this.loginState = e;
    }

    public setEmail(email: string) {
        this.userEmail = email;
    }

    public setName(name: string) {
        this.userName = name;
    }

    public showTerms() {
        let popover = this.popoverCtrl.create(TermsAndConditions, {}, { cssClass: "terms-popover" });
        popover.present();
    }

    public showRegisterTutorialSlide() {
        let popover = this.popoverCtrl.create(RegisterSlidePopover, {}, { cssClass: "tutorial-slide" });
        popover.present();
    }

    private checkMobileBrowser() {
        let platformsRegex = [/Android/i, /webOS/i, /iPhone/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];
        let userAgent = navigator.userAgent;
        let isMobile = platformsRegex.some(reg => reg.test(userAgent));
        if (isMobile) {
            this.translateSrv.get([this.WARNING_KEY, this.NOT_FOR_MOBILE_KEY])
            .subscribe(response => this.popupSrv.showAlert(response[this.WARNING_KEY], response[this.NOT_FOR_MOBILE_KEY]));
        }
    }
}

