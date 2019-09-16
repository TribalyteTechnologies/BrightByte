import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";

@Injectable()
export class UserAddressService {

    private log: ILogger;
    private address: string;

    constructor(loggerSrv: LoggerService){ 
        this.log = loggerSrv.get("UserCacheService");
    }

    public set(address: string){
        this.log.d("User addres stored: " + address);
        this.address = address;
    }

    public get(){
        return this.address;
    }
 
}
