import {ILogger, LoggerService} from "./logger.service";
import {Injectable} from "@angular/core";

@Injectable()
export class SessionStorageService {

    private log: ILogger;

    constructor(loggerSrv: LoggerService) {

        this.log = loggerSrv.get("SessionStorageService");
    }

    public set(key: string, item: any) {
        let valStr = JSON.stringify({item: item});
        this.log.d("Storing on sessionStorage \"" + key + "\" with value \"" + valStr + "\"");
        sessionStorage.setItem(key, valStr);
    }

    public get(key: string) {
        let val = JSON.parse(sessionStorage.getItem(key));
        return ((val && val.item) ? val.item : null);
    }

    public remove(key: string) {
        this.log.d("Removing from sessionStorage key \"" + key + "\"");
        sessionStorage.removeItem(key);
    }

    public clear() {
        this.log.d("Clearing sessionStorage");
        sessionStorage.clear();
    }
}
