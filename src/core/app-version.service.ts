import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { Observable } from "rxjs/Rx";
import { HttpClient } from "@angular/common/http";
import { LocalStorageService } from "./local-storage.service";
import { StorageService } from "./storage.service";
import { AppConfig } from "../app.config";

@Injectable()
export class AppVersionService {
    private log: ILogger;
    private strg: StorageService;
    
    private readonly VERSION_FILE_PATH = "config.xml";
    private readonly VERSION_EXTRACT_REGEX = /widget.*?version=[\"\'](.*?)[\"\']/;
    private currentVersion: string;

    constructor(
        private http: HttpClient,
        loggerSrv: LoggerService,
        storageSrv: LocalStorageService
    ) {
        this.log = loggerSrv.get("AppVersionService");
        this.strg = storageSrv;
        this.currentVersion = storageSrv.get(AppConfig.StorageKey.LOCALSTORAGEVERSION);
    }

    public getAppVersion(): Observable<string> {
        let randomQuery = this.VERSION_FILE_PATH + "?t=" + Date.now();
        return this.http.get(randomQuery, {responseType: "text"})
        .map(xmlConfig => {
            let ver = this.VERSION_EXTRACT_REGEX.exec(xmlConfig)[1];
            if (ver !== this.currentVersion){
                window.alert("Your BrightBight version is outdated. The page is going to refresh.");
                this.strg.set(AppConfig.StorageKey.LOCALSTORAGEVERSION, ver);
                window.location.reload(true);
            }
            this.log.d("Application version extracted: ", ver);
            return ver;
        });
    }
}
