import { Component } from "@angular/core";
import { NavController, ViewController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";

@Component({
    selector: "share-popover",
    templateUrl: "sharepopover.html"
})
export class SharePopOver {

    private log: ILogger;

    constructor(
        private loggerSrv: LoggerService,
        public navCtrl: NavController,
        public viewCtrl: ViewController
    ) {
        this.log = this.loggerSrv.get("SharePopOver");
    }
}
