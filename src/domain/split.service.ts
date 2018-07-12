import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";

@Injectable()
export class SplitService {

    private log: ILogger;

    constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("SplitService");
    }
    public getId(url): string {
        let urlSplitted = url.split("/");
        let id: string = urlSplitted[6];
        return id;
    }
    public getProject(url): string {
        let urlSplitted = url.split("/");
        let project: string = urlSplitted[4];
        return project;

    }
}

