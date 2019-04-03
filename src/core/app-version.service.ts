import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { Observable } from "rxjs/Rx";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class AppVersionService {
    private log: ILogger;
    
    private readonly VERSION_FILE_PATH = "config.xml";
    private readonly VERSION_EXTRACT_REGEX = /widget.*?version=[\"\'](.*?)[\"\']/mg;

    constructor(
        private http: HttpClient,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("AppVersionService");
    }

    public getAppVersion(): Observable<string> {
        let randomQuery = this.VERSION_FILE_PATH + "?t=" + Date.now();
        return this.http.get(randomQuery, {responseType: "text"})
        .map(xmlConfig => {
            let ver = this.VERSION_EXTRACT_REGEX.exec(xmlConfig)[1];
            this.log.d("Application version extracted: ", ver);
            return ver;
        });
    }
}
