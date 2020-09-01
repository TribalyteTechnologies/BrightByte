import { Component } from "@angular/core";
import { Platform } from "ionic-angular";

import { TranslateService } from "@ngx-translate/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { AppConfig } from "../app.config";
import { LoginPage } from "../pages/login/login";
import { Observable } from "rxjs";
import { TransactionQueueService } from "../domain/transaction-queue.service";

@Component({
    templateUrl: "app.html"
})
export class BrightByteApp {

    public rootPage = LoginPage; //TabsPage;
    private log: ILogger;
    private isProcessing: Observable<any>;

    constructor(
        private translateService: TranslateService,
        private loggerSrv: LoggerService,
        private transactionQueueSrv: TransactionQueueService,
        platform: Platform) {

        this.log = this.loggerSrv.get("AppComponent");

        this.initTranslate();

        platform.ready().then(() => {
            this.log.d("Platform Ready");
        });
    }

    public ngOnInit() {
        this.isProcessing = this.transactionQueueSrv.getProcessingStatus();
      }

    public doBeforeUnload() {
        return !this.isProcessing;
    }

    private initTranslate() {
        // Set the default language for translation strings, and the current language.
        this.translateService.setDefaultLang(AppConfig.DEFAULT_LANGUAGE);
        let userLang = this.translateService.getBrowserLang();
        this.log.d("Browser Language: ", userLang);
        userLang = (AppConfig.AVAILABLE_LANGUAGE_KEYS.indexOf(userLang) > -1) ? userLang : AppConfig.DEFAULT_LANGUAGE;
        this.log.d("Used language to translate: ", userLang);

        this.translateService.use(userLang || AppConfig.DEFAULT_LANGUAGE);
    }

}
