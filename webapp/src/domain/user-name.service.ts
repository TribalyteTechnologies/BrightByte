import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { Observable, Subject } from "rxjs";
import { map, catchError, shareReplay, merge} from "rxjs/operators";
import { ContractManagerService } from "./contract-manager.service";
import { from } from "rxjs/observable/from";
import { UserDetails } from "../models/user-details.model";

@Injectable()
export class UserNameService {

    private readonly LATEST_LOGO_BUFFER_COUNT = 1;

    private log: ILogger;
    private nameObs: Observable<string>;
    private nameSubj = new Subject<string>();

    constructor(
        loggerSrv: LoggerService,
        private contractManager: ContractManagerService
    ) {
        this.log = loggerSrv.get("UserNameService");
    }

    public setUserObs(hash: string): Observable<string> {
        if (hash && !this.nameObs) {
            this.nameSubj = new Subject<string>();
            this.nameObs = from(this.contractManager.getUserDetails(hash)).pipe(
                catchError((error) => {
                    throw error;
                }),
                map((response: UserDetails) => {
                    return response.name;
                }), 
                merge(this.nameSubj),
                shareReplay(this.LATEST_LOGO_BUFFER_COUNT)
            );
        }
        return this.nameObs;
    }

    public updateName(name: string) {
        this.nameSubj.next(name);
    }

    public getNameObs(): Observable<string> {
        return this.nameObs;
    }
}
