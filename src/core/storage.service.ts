import {ILogger, LoggerService} from "./logger.service";
import {Injectable} from "@angular/core";

@Injectable()
export class StorageService {

    private log: ILogger;

    constructor(loggerSrv: LoggerService) {

        this.log = loggerSrv.get("StorageService");
    }

    public set(key: string, item: any) {
        let valStr = JSON.stringify({item: item});
        this.log.d("Storing on localStorage \"" + key + "\" with value \"" + valStr + "\"");
        localStorage.setItem(key, valStr);
    }

    public get(key: string) {
        let val = JSON.parse(localStorage.getItem(key));
        return ((val && val.item) ? val.item : null);
    }

    public remove(key: string) {
        this.log.d("Removing from localStorage key \"" + key + "\"");
        localStorage.removeItem(key);
    }

    public clear() {
        this.log.d("Clearing localStorage");
        localStorage.clear();
    }
}
