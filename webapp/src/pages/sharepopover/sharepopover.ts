import { Component } from "@angular/core";
import { ILogger, LoggerService } from "../../core/logger.service";

@Component({
    selector: "share-popover",
    templateUrl: "sharepopover.html"
})
export class SharePopOver {

    private log: ILogger;

    constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("SharePopOver");
    }
}
