import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";
import { AppConfig } from "../app.config";
import { IResponse } from "../models/response.model";
import { LoggerService, ILogger } from "../core/logger.service";
import { Repository } from "../models/repository.model";
import { BitbucketCommitResponse } from "../models/commit-info.model";

@Injectable()
export class BitbucketService {

    private userToken: string;
    private userIdentifier: string;
    private headers: HttpHeaders;
    private log: ILogger;
    private windowInstance: Window;
    private eventEmitter = new EventEmitter<boolean>();

    constructor(
        private http: HttpClient,
        private storageSrv: LocalStorageService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("BitbucketService");
        this.userToken = this.getToken();
        this.setNewTokenHeader(this.userToken);
    }

    public getLoginEmitter(): EventEmitter<boolean> {
        return this.eventEmitter;
    }

    public loginToBitbucket(userAddress: string): Promise<string> {
        this.userIdentifier = userAddress;
        return this.http.get(AppConfig.SERVER_BITBUCKET_AUTHENTICATION_URL + userAddress).toPromise()
        .then((response: IResponse) => {
            let url = response.data;
            this.log.d("Opening bitbucket pop-up");
            this.windowInstance = window.open(url);
            return response.data;
        });
    }

    public setUserAddress(userAddress: string) {
        this.userIdentifier = userAddress;
    }

    public async getUsername(): Promise<string> {
        const params = new HttpParams().set("fields", "nickname");
        this.log.d("The user token is", this.userToken);
        return this.http.get(AppConfig.BITBUCKET_USER_URL, { params: params, headers: this.headers }).toPromise()
        .then(result => {
            return result["nickname"];
        }).catch(err => {
            this.log.e("Error getting user details from provider :", err);
            return this.refreshToken();
        });
    }

    public getRepositories(seasonStartDate: Date): Promise<Array<Repository>> {
        const params = new HttpParams().set("fields", "values.name,values.slug")
            .set("updated_on>", seasonStartDate.toISOString())
            .set("sort", "-updated_on");
    
        return this.http.get(AppConfig.BITBUCKET_REPOSITORIES_URL, { params: params, headers: this.headers }).toPromise()
            .then(val => {
                this.log.d("The values are", val);
                return val["values"];
            });
    }

    public getReposlug(repo_slug: string): Promise<BitbucketCommitResponse> {
        const params = new HttpParams().set("fields", "next,values.author.user,values.date,values.hash,values.message");

        let url = AppConfig.BITBUCKET_REPOSITORIES_URL + repo_slug + "/commits";

        return this.http.get(url, { params: params, headers: this.headers }).toPromise()
            .then((val: BitbucketCommitResponse) => {
                this.log.d("The values are from resposlug", val);
                return val;
            });
    }

    public getNextReposlug(url: string): Promise<BitbucketCommitResponse> {
        return this.http.get(url, { headers: this.headers }).toPromise()
            .then((val: BitbucketCommitResponse) => {
                this.log.d("The values are from next reposlug", val);
                return val;
            });
    }

    public getToken(): string {
        this.userToken = this.storageSrv.get(AppConfig.StorageKey.BITBUCKETUSERTOKEN);
        return this.userToken;
    }

    public setUserToken(userToken: string) {
        this.userToken = userToken;
        this.headers = new HttpHeaders({
            "Authorization": "Bearer " + this.userToken
        });
        this.storageSrv.set(AppConfig.StorageKey.BITBUCKETUSERTOKEN, userToken);
        if(this.windowInstance) {
            this.windowInstance.close();
        }
        this.setNewTokenHeader(this.userToken);
        this.eventEmitter.emit(true);
    }

    private refreshToken(): Promise<string> {
        this.log.d("Token experied, getting a new one for user: " + this.userIdentifier);
        return this.loginToBitbucket(this.userIdentifier)
        .then(authUrl => {
            this.log.d("Refreshing token");
            return authUrl;
        });
    }

    private setNewTokenHeader(userToken: string) {
        this.headers = new HttpHeaders({
            "Authorization": "Bearer " + userToken
        });
    }
}
