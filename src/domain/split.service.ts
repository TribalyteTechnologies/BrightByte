import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";

@Injectable()
export class Split {

    private log: ILogger;

    constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("SplitService");
    }
    public splitIDAndProject(url): string[] {
        let urlSplitted = url.split("/");
        this.log.d("Url splited: ", urlSplitted);
        let project: string = urlSplitted[4];
        let id: string = urlSplitted[6];
        return [project, id];

    }
}

