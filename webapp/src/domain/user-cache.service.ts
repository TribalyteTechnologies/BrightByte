import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { UserDetails } from "../models/user-details.model";


@Injectable()
export class UserCacheService {

    private log: ILogger;
    private users = new Map<string, UserDetails>();

    constructor(loggerSrv: LoggerService){ 
        this.log = loggerSrv.get("UserCacheService");
    }

    public getUser(hash: string): Promise<UserDetails>{
        return this.users.has(hash) ? Promise.resolve(this.users.get(hash)) : Promise.reject(new Error("Not found"));
    }

    public set(hash: string, userDetails: UserDetails){
        this.users.set(hash, userDetails);
    }

    public setUserName(hash: string, userName: string) {
        let user = this.users.get(hash);
        if (user) {
            user.name = userName;
            this.users.set(hash, user);
        }
    }
}
