import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";
import { AppConfig } from "../app.config";
import { AddCommitPopover } from "../pages/addcommit/addcommit";
import { PopoverController } from "ionic-angular";
import { IResponse } from "../models/response.model";
import { LoggerService, ILogger } from "../core/logger.service";

@Injectable()
export class BitbucketService {

    public userDetails = {};
    private userToken: string;
    private userIdentifier: string;
    private log: ILogger;

    constructor(
        private http: HttpClient,
        private storageSrv: LocalStorageService,
        private popoverCtrl: PopoverController,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("BitbucketService");
        this.userToken = this.getToken();
    }

    public loginToBitbucket(userAddress: string): Promise<string> {
        this.userIdentifier = userAddress;
        return this.http.get(AppConfig.SERVER_BITBUCKET_AUTHENTICATION_URL + userAddress).toPromise()
        .then((response: IResponse) => response.data);
    }

    public setUserAddress(userAddress: string) {
        this.userIdentifier = userAddress;
    }

    public getUsername(): Promise<Object> {
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.userToken
        });
        return this.http.get(AppConfig.BITBUCKET_USER_URL, { headers }).toPromise()
        .then(val => {
            this.userDetails = val;
            return val;
        });
    }

    public getUserDetails(): Object {
        return this.userDetails;
    }

    public getRepositories(): Promise<Array<Object>> {
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.userToken
        });
        return this.http.get(AppConfig.BITBUCKET_REPOSITORIES_URL, { headers }).toPromise()
            .then(val => {
                return val["values"];
            });
    }

    public getReposlug(repo_slug: string): Promise<Object> {
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.userToken
        });

        let url = AppConfig.BITBUCKET_REPOSITORIES_URL + repo_slug + "/commits";

        return this.http.get(url, { headers }).toPromise().then(val => {
            return val;
        });
    }

    public getNextReposlug(url: string): Promise<Object> {
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.userToken
        });
        return this.http.get(url, { headers }).toPromise().then(val => {
            return val;
        });
    }

    public getToken(): string {
        return this.storageSrv.get(AppConfig.StorageKey.BITBUCKETUSERTOKEN);
    }

    public setUserToken(userToken: string) {
        this.userToken = userToken;
        this.storageSrv.set(AppConfig.StorageKey.BITBUCKETUSERTOKEN, userToken);
        let popover = this.popoverCtrl.create(AddCommitPopover, { authenticationVerified: true }, { cssClass: "add-commit-popover" });
        popover.present();
    }
}
