import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { LoginService } from "../../core/login.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "page-home",
    templateUrl: "home.html"
})
export class HomePage {
    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        loggerSrv: LoggerService,
        public translateService: TranslateService,
        private loginService: LoginService
    ) {
        this.log = loggerSrv.get("HomePage");
    }

}
