import {ILogger, LoggerService} from "./logger.service";
import {Injectable} from "@angular/core";

@Injectable()
export abstract class StorageService {

    private storage = localStorage;
    private log: ILogger;
    private storageType: StorageService.StorageTypeEnum;

    constructor(storageType: StorageService.StorageTypeEnum, loggerSrv: LoggerService) {

        this.log = loggerSrv.get("StorageService");
        this.storageType = storageType;

        if (storageType === StorageService.StorageTypeEnum.Local){
            this.storage = localStorage;
        }else{
            this.storage = sessionStorage;
        }
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
}

export namespace StorageService {
    export enum StorageTypeEnum {
        Local = "LocalStorage",
        Session = "SessionStorage"
    }
}
