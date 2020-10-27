import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";
import { AppConfig } from "../app.config";
import { IResponse, IWorkspaceResponse } from "../models/response.model";
import { LoggerService, ILogger } from "../core/logger.service";
import { BitbucketRepositoryResponse } from "../models/bitbucket/repository.model";
import { BitbucketCommitResponse, BitbucketUserInfo } from "../models/bitbucket/commit-info.model";
import { BitbucketPullRequestResponse, BitbucketPrCommitsResponse } from "../models/bitbucket/pull-request.model";
import { BackendConfig } from "../models/backend-config.model";
import { PopupService } from "./popup.service";

export class BitbucketApiConstants {
    public static readonly SERVER_AUTHENTICATION_URL =  AppConfig.SERVER_BASE_URL + "/authentication/authorize/";
    public static readonly SERVER_SYSTEM_CONFIG_URL = AppConfig.SERVER_BASE_URL + "/team/";
    public static readonly BASE_URL = "https://bitbucket.org/";
    public static readonly USER_BASE_URL = "https://api.bitbucket.org/2.0/user/";
    public static readonly REPOSITORIES_BASE_URL = "https://api.bitbucket.org/2.0/repositories/";
    public static readonly SORT_BY_DATE_QUERY = "-updated_on";
    public static readonly FIELDS_USER = "uuid";
    public static readonly FIELDS_REPO = "values.name,values.slug,next";
    public static readonly FIELDS_COMMITS = "next,values.author.user.uuid,values.date,values.hash,values.message,values.parents.hash";
    public static readonly FIELDS_PULLREQUESTS = "next,values.author.uuid,values.title,values.destination.commit.hash,values.links.commits.href,values.updated_on,values.id";
    public static readonly FIELDS_PULLREQUEST_COMMITS = "next,values.hash";
    public static readonly PULLREQUEST_STATE = "MERGED,OPEN";
    public static readonly TAG_FIELDS = "fields";
    public static readonly TAG_SORT = "sort";
    public static readonly TAG_STATE = "state";
    public static readonly TAG_SORT_BY_UPDATE_DATE = "q=updated_on>";
    public static readonly PROVIDER_NAME = "bitbucket";
}

@Injectable()
export class BitbucketService {
    private userToken: string;
    private userIdentifier: string;
    private userTeamUid: number;
    private currentVersion: string;
    private headers: HttpHeaders;
    private log: ILogger;
    private authWindow: Window;
    private eventEmitter = new EventEmitter<boolean>();

    constructor(
        private http: HttpClient,
        private storageSrv: LocalStorageService,
        private popupSrv: PopupService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("BitbucketService");
        this.userToken = this.getToken();
        this.setNewTokenHeader(this.userToken);
    }

    public getLoginEmitter(): EventEmitter<boolean> {
        return this.eventEmitter;
    }

    public checkProviderAvailability(userAddress: string, teamUid: number, version: string): Promise<boolean> {
        this.log.d("Checks the api works correctly");
        this.userIdentifier = userAddress;
        this.userTeamUid = teamUid;
        this.currentVersion = version;
        return this.getUsername().then(name => {
            this.log.d("The api provider works, the user nickname is:", name);
            this.eventEmitter.emit(true);
            return true;
        }).catch(async err => {
            this.log.e("Error getting the provider api:", err);
            let ret = await this.refreshToken();
            this.log.d("The refresh response is", ret);
            return false;
        });
    }

    public getUsername(): Promise<string> {
        const params = new HttpParams().set(BitbucketApiConstants.TAG_FIELDS, BitbucketApiConstants.FIELDS_USER);
        this.log.d("The user token is", this.userToken);
        return this.http.get<BitbucketUserInfo>(BitbucketApiConstants.USER_BASE_URL, { params: params, headers: this.headers }).toPromise()
        .then(result => result.uuid);
    }

    public getRepositories(workspace: string, seasonStartDate: Date): Promise<BitbucketRepositoryResponse> {
        const params = new HttpParams().set(BitbucketApiConstants.TAG_FIELDS, BitbucketApiConstants.FIELDS_REPO)
            .set(BitbucketApiConstants.TAG_SORT_BY_UPDATE_DATE, seasonStartDate.toISOString().split("+")[0])
            .set(BitbucketApiConstants.TAG_SORT, BitbucketApiConstants.SORT_BY_DATE_QUERY);
        let url = BitbucketApiConstants.REPOSITORIES_BASE_URL + workspace;
        return this.http.get<BitbucketRepositoryResponse>(url, { params: params, headers: this.headers }).toPromise()
        .then(val => {
            this.log.d("The values are", val);
            return val;
        });
    }

    public getNextRepositories(url: string): Promise<BitbucketRepositoryResponse> {
        return this.http.get<BitbucketRepositoryResponse>(url, { headers: this.headers }).toPromise()
        .then(val => {
            this.log.d("The values are from next repos", val);
            return val;
        });
    }

    public getReposlug(workspace: string, repo_slug: string): Promise<BitbucketCommitResponse> {
        const params = new HttpParams().set(BitbucketApiConstants.TAG_FIELDS, BitbucketApiConstants.FIELDS_COMMITS);

        let url = BitbucketApiConstants.REPOSITORIES_BASE_URL + workspace + "/" + repo_slug + "/commits";

        return this.http.get<BitbucketCommitResponse>(url, { params: params, headers: this.headers }).toPromise()
        .then(val => {
            this.log.d("The values are from resposlug", val);
            return val;
        });
    }

    public getNextReposlug(url: string): Promise<BitbucketCommitResponse> {
        return this.http.get<BitbucketCommitResponse>(url, { headers: this.headers }).toPromise()
        .then(val => {
            this.log.d("The values are from next reposlug", val);
            return val;
        });
    }

    public getNextPullrequest(url: string): Promise<BitbucketPullRequestResponse> {
        return this.http.get<BitbucketPullRequestResponse>(url, { headers: this.headers }).toPromise()
        .then(val => {
            this.log.d("The values are from next pull request page", val);
            return val;
        });
    }

    public getPullRequests(workspace: string, repo_slug: string): Promise<BitbucketPullRequestResponse> {
        const params = new HttpParams().set(BitbucketApiConstants.TAG_STATE, BitbucketApiConstants.PULLREQUEST_STATE)
            .set(BitbucketApiConstants.TAG_SORT, BitbucketApiConstants.SORT_BY_DATE_QUERY)
            .set(BitbucketApiConstants.TAG_FIELDS, BitbucketApiConstants.FIELDS_PULLREQUESTS);

        let url = BitbucketApiConstants.REPOSITORIES_BASE_URL + workspace + "/" + repo_slug + "/pullrequests/";

        return this.http.get<BitbucketPullRequestResponse>(url, { params: params, headers: this.headers }).toPromise()
        .then(val => {
            this.log.d("The values are from pull request", val);
            return val;
        });
    }

    public getPrCommits(url: string): Promise<BitbucketPrCommitsResponse> {
        const params = new HttpParams().set(BitbucketApiConstants.TAG_FIELDS, BitbucketApiConstants.FIELDS_PULLREQUEST_COMMITS);
        return this.http.get<BitbucketPrCommitsResponse>(url, { params: params, headers: this.headers }).toPromise()
        .then(val => {
            this.log.d("The values are from PR commits", val);
            return val;
        });
    }

    public setUserToken(userToken: string) {
        this.userToken = userToken;
        this.storageSrv.set(AppConfig.StorageKey.BITBUCKETUSERTOKEN, userToken);
        if(this.authWindow) {
            this.authWindow.close();
            this.authWindow = null;
        }
        this.setNewTokenHeader(this.userToken);
        this.eventEmitter.emit(true);
    }

    public getTeamBackendConfig(teamUid: number, userAddress: string, version: string): Promise<BackendConfig> {
        let urlCall = BitbucketApiConstants.SERVER_SYSTEM_CONFIG_URL + teamUid + "/" + version + "/workspace/" + userAddress;
        return this.http.get(urlCall).toPromise().then((result: IWorkspaceResponse) => new BackendConfig(result.data));
    }

    private loginToBitbucket(userAddress: string, teamUid: number, version: string): Promise<string> {
        this.userIdentifier = userAddress;
        this.userTeamUid = teamUid;
        this.currentVersion = version;
        const provider = BitbucketApiConstants;
        const urlAuth = provider.SERVER_AUTHENTICATION_URL + provider.PROVIDER_NAME + "/" + userAddress + "/" + teamUid + "/" + version;
        return this.http.get(urlAuth).toPromise()
        .then((response: IResponse) => {
            if (response.status === AppConfig.STATUS_OK) {
                let url = response.data;
                this.log.d("Opening bitbucket pop-up");
                this.popupSrv.openUrlNewTab(url)
                .then((tab: Window) => {
                    this.authWindow = tab;
                });
            } else {
                this.log.w("Bitbucket Provider not defined, feature not available", response);
                throw new Error(response.data);
            }
            return response.data;
        });
    }

    private getToken(): string {
        return  this.storageSrv.get(AppConfig.StorageKey.BITBUCKETUSERTOKEN);
    }

    private refreshToken(): Promise<string> {
        this.log.d("Token experied, getting a new one for user: " + this.userIdentifier);
        return this.loginToBitbucket(this.userIdentifier, this.userTeamUid, this.currentVersion)
        .then(authUrl => {
            this.log.d("Refreshing token", authUrl);
            return authUrl;
        }).catch(e => {
            this.log.e("Bitbucket Provider not defined, feature not available");
            throw e;
        });
    }

    private setNewTokenHeader(userToken: string) {
        this.headers = new HttpHeaders({
            "Authorization": "Bearer " + userToken
        });
    }
}
