import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { UserDetails } from "../models/user-details.model";


@Injectable()
export class UserCacheService {

    private log: ILogger;
    private users: Map<string, UserDetails> = new Map<string, UserDetails>();

    constructor(loggerSrv: LoggerService){ 
        this.log = loggerSrv.get("UserCacheService");
    }

    public hasAndReturn(hash: string): UserDetails{
        return this.users.has(hash) ? this.users.get(hash) : null;
    }

    public set(hash: string, userDetails: UserDetails){
        this.users.set(hash, userDetails);
    }
 
}
