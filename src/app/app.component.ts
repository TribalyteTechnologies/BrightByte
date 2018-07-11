import { Component } from "@angular/core";
import { Platform } from "ionic-angular";

import { TranslateService } from "@ngx-translate/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { AppConfig } from "../app.config";
import { LoginPage } from "../pages/login/login";

@Component({
    templateUrl: "app.html"
})
export class BrightByteApp {

    public rootPage = LoginPage; //TabsPage;
    private log: ILogger;

    constructor(private translateService: TranslateService,
        private loggerSrv: LoggerService,
        platform: Platform) {

        this.log = this.loggerSrv.get("AppComponent");

        this.initTranslate();

        platform.ready().then(() => {
            this.log.d("Platform Ready");
        });
    }

    private initTranslate() {
        // Set the default language for translation strings, and the current language.
        this.translateService.setDefaultLang(AppConfig.DEFAULT_LANGUAGE);
        let userLang = this.translateService.getBrowserLang();
        this.log.d("Browser Language: ", userLang)
        userLang = (AppConfig.AVAILABLE_LANGUAGE_KEYS.indexOf(userLang) > -1) ? userLang : AppConfig.DEFAULT_LANGUAGE;
        this.log.d("Used language to translate: ", userLang)

        this.translateService.use(userLang || AppConfig.DEFAULT_LANGUAGE);
    }

}
