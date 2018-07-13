import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
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
        public translateService: TranslateService
    ) {
        this.log = loggerSrv.get("HomePage");
    }

}
