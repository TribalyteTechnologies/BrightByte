import { AppConfig } from "./../app.config";
import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { LocalStorageService } from "../core/local-storage.service";


@Injectable()
export class UserLoggerService {

    private readonly STORAGE_KEY_USERNAME = AppConfig.StorageKey.USERNAME;
    private readonly STORAGE_KEY_PASSWORD = AppConfig.StorageKey.PASSWORD;
    private readonly STORAGE_KEY_LOGUSERNAME = AppConfig.StorageKey.LOGUSERNAME;
    private readonly STORAGE_KEY_LOGPASSWORD = AppConfig.StorageKey.LOGPASSWORD;
    private readonly STORAGE_KEY_MIGRATION = AppConfig.StorageKey.MIGRATION;
    private log: ILogger;

    constructor(loggerSrv: LoggerService, private storageSrv: LocalStorageService){ 
        this.log = loggerSrv.get("UserLoggerService");
    }

    public setAccount(user: string, password: string){
        this.storageSrv.set(this.STORAGE_KEY_USERNAME, JSON.stringify(user));
        this.storageSrv.set(this.STORAGE_KEY_PASSWORD, password);
    }

    public setLogAccount(user: string, password: string){
        this.storageSrv.set(this.STORAGE_KEY_LOGUSERNAME, JSON.stringify(user));
        this.storageSrv.set(this.STORAGE_KEY_LOGPASSWORD, password);
    }

    public retrieveAccount(): any {
        let user = JSON.parse(this.storageSrv.get(this.STORAGE_KEY_USERNAME));
        let pass = this.storageSrv.get(this.STORAGE_KEY_PASSWORD);
        return {user: user, password: pass};
    }

    public retrieveLogAccount(): any {
        let user = JSON.parse(this.storageSrv.get(this.STORAGE_KEY_LOGUSERNAME));
        let pass = this.storageSrv.get(this.STORAGE_KEY_LOGPASSWORD);
        return {user: user, password: pass};
    }

    public removeLogAccount(){
        this.storageSrv.remove(this.STORAGE_KEY_LOGUSERNAME);
        this.storageSrv.remove(this.STORAGE_KEY_LOGPASSWORD);
    }

    public logout(){
        this.storageSrv.remove(this.STORAGE_KEY_USERNAME);
        this.storageSrv.remove(this.STORAGE_KEY_PASSWORD);
    }

    public getMigration(): boolean{
        let migration = this.storageSrv.get(this.STORAGE_KEY_MIGRATION);
        return Boolean(migration);
    }
    public setMigration()  {
        this.storageSrv.set(this.STORAGE_KEY_MIGRATION, true);
    }
 
}
