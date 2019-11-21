import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { Observable, Subject } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { map, catchError, share } from "rxjs/operators";
import { IResponse } from "../models/response.model";

@Injectable()
export class AvatarService {

    private readonly ANONYMOUS_ADDRESS = "0x0";

    private log: ILogger;
    private avatarObsMap = new Map<string, Observable<string>>();
    private avatarSubjMap = new Map<string, Subject<string>>();

    constructor(
        loggerSrv: LoggerService,
        private http: HttpClient
    ) {
        this.log = loggerSrv.get("AvatarService");
        //This null is added for the anonymous users to be recognise
        this.addUser(null);
    }

    public addUser(hash: string) {
        if (!this.avatarObsMap.has(hash) && hash) {
            let avatarSubj = new Subject<string>();
            let avatarObs = this.http.get(AppConfig.PROFILE_IMAGE_URL + hash + AppConfig.AVATAR_STATUS_PATH).pipe(
                catchError((error) => {
                    this.log.e("ERROR: " + error.message);
                    let imageUrl = this.createIdenticonUrl(hash);
                    return imageUrl;
                }),
                map((response: IResponse) => {
                    let imageUrl = (response && response.status === AppConfig.STATUS_OK) ? 
                    AppConfig.SERVER_BASE_URL + response.data : this.createIdenticonUrl(hash);
                    return imageUrl;
                }),
                share());
            avatarObs = Observable.merge(avatarObs, avatarSubj);
            this.avatarObsMap.set(hash, avatarObs);
            this.avatarSubjMap.set(hash, avatarSubj);
        }else if (!hash) {
            let avatarObs: Observable<string> = 
                Observable.of(this.createIdenticonUrl(this.ANONYMOUS_ADDRESS));
            this.avatarObsMap.set(this.ANONYMOUS_ADDRESS, avatarObs);
        }
    }

    public updateUrl(hash: string, url?: string) {
        let newUrl = url ? url : this.createIdenticonUrl(hash);
        this.avatarSubjMap.get(hash)
            .next(newUrl + "?r=" + Math.random());
    }

    public getAvatarObs(hash: string): Observable<string> {
        return this.avatarObsMap.get(this.avatarObsMap.has(hash) ? hash : this.ANONYMOUS_ADDRESS);
    }

    private createIdenticonUrl(hash: string): string{
        return AppConfig.IDENTICON_URL + hash + AppConfig.IDENTICON_FORMAT;
    }
}
