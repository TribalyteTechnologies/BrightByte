import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { Observable, Subject } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { map, catchError } from "rxjs/operators";


interface IResponse {
    data: string;
    status: string;
}

@Injectable()
export class AvatarService {

    private readonly PROFILE_IMAGE_URL = AppConfig.SERVER_BASE_URL + "/profile-image/";
    private readonly GET_PROFILE_IMAGE = this.PROFILE_IMAGE_URL + "getPath/";
    private readonly IDENTICON_URL = "https://avatars.dicebear.com/v2/identicon/";
    private readonly IDENTICON_FORMAT = ".svg";

    private log: ILogger;
    private avatarObsMap = new Map<string, Observable<string>>();
    private avatarSubjMap = new Map<string, Subject<string>>();

    constructor(
        loggerSrv: LoggerService,
        private http: HttpClient
    ) {
        this.log = loggerSrv.get("AvatarService");
    }

    public addUser(hash: string) {
        if (!this.avatarObsMap.has(hash)) {
            let avatarSubj = new Subject<string>();
            let avatarObs: Observable<string> = this.http.get(this.GET_PROFILE_IMAGE + hash).pipe(
                catchError((error) => {
                    this.log.e("ERROR: " + error.message);
                    let imageUrl = this.IDENTICON_URL + hash + this.IDENTICON_FORMAT;
                    return imageUrl;
                }),
                map((response: IResponse) => {
                    let imageUrl = "";
                    if (response && response.status === AppConfig.STATUS_OK) {
                        imageUrl = this.PROFILE_IMAGE_URL + response.data;
                    } else {
                        imageUrl = this.IDENTICON_URL + hash + this.IDENTICON_FORMAT;
                    }
                    return imageUrl;
                }));
            avatarObs = Observable.merge(avatarObs, avatarSubj);
            this.avatarObsMap.set(hash, avatarObs);
            this.avatarSubjMap.set(hash, avatarSubj);
        }
    }

    public updateUrl(hash: string, url?: string) {
        let newUrl = url ? url : this.IDENTICON_URL + hash + this.IDENTICON_FORMAT;
        this.avatarSubjMap.get(hash)
            .next(newUrl + "?r=" + Math.random());
    }

    public getAvatarObs(hash: string): Observable<string> {
        return this.avatarObsMap.has(hash) ? this.avatarObsMap.get(hash) : Observable.throw("No user image for " + hash);
    }
}
