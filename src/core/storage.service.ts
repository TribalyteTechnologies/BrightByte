import {ILogger, LoggerService} from "./logger.service";
import {Injectable} from "@angular/core";

@Injectable()
export class StorageService {

    public storage = localStorage;
    private log: ILogger;
    private storageType: string;
    

    constructor(loggerSrv: LoggerService) {

        this.log = loggerSrv.get("StorageService");
        this.selectStorageType();
    }

    public set(key: string, item: any) {
        let valStr = JSON.stringify({item: item});
        this.log.d("Storing on " + this.storageType + " \"" + key + "\" with value \"" + valStr + "\"");
        this.storage.setItem(key, valStr);
    }

    public get(key: string) {
        let val = JSON.parse(this.storage.getItem(key));
        return ((val && val.item) ? val.item : null);
    }

    public remove(key: string) {
        this.log.d("Removing from " + this.storageType + " key \"" + key + "\"");
        this.storage.removeItem(key);
    }

    public clear() {
        this.log.d("Clearing " + this.storageType);
        this.storage.clear();
    }

    private selectStorageType() {

        if (this.storage === localStorage){
            this.storageType = "localStorage";
        }else{
            this.storageType = "sessionStorage";
        }
    }
}
