import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";
import { AppConfig } from "../app.config";
import { IResponse } from "../models/response.model";
import { LoggerService, ILogger } from "../core/logger.service";
import { BitbucketRepository, BitbucketRepositoryResponse } from "../models/repository.model";
import { BitbucketCommitResponse, BitbucketUserInfo } from "../models/commit-info.model";
import { BitbucketPullRequestResponse, BitbucketPRCommitsResponse } from "../models/pull-request.model";

export class BitbucketApiConstants {
    public static readonly SERVER_AUTHENTICATION_URL =  AppConfig.SERVER_BASE_URL + "/authentication/authorize/";
    public static readonly BASE_URL = "https://bitbucket.org/";
    public static readonly USER_BASE_URL = "https://api.bitbucket.org/2.0/user/";
    public static readonly REPOSITORIES_BASE_URL = "https://api.bitbucket.org/2.0/repositories/";
    public static readonly SORT_RULE = "-updated_on";
    public static readonly FIELDS_USER = "nickname";
    public static readonly FIELDS_REPO = "values.name,values.slug";
    public static readonly FIELDS_COMMITS = "next,values.author.user,values.date,values.hash,values.message,values.parents.hash";
    public static readonly FIELDS_PULLREQUESTS = "next,values.author.nickname,values.title,values.destination.commit.hash,values.links.commits.href,values.updated_on,values.id";
    public static readonly FIELDS_PULLREQUEST_COMMITS = "next,values.hash";
    public static readonly PULLREQUEST_STATE = "MERGED,OPEN";
}

export class BitbucketApiEnvConfig {
    public BITBUCKET_WORKSPACES: string;
}

@Injectable()
export class BitbucketService {
    private userToken: string;
    private userIdentifier: string;
    private headers: HttpHeaders;
    private log: ILogger;
    private authWindow: Window;
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

    public checkProviderAvailability(userAddress: string): Promise<boolean> {
        this.log.d("Checks the api works correctly");
        this.userIdentifier = userAddress;
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
        const params = new HttpParams().set("fields", BitbucketApiConstants.FIELDS_USER);
        this.log.d("The user token is", this.userToken);
        return this.http.get<BitbucketUserInfo>(BitbucketApiConstants.USER_BASE_URL, { params: params, headers: this.headers }).toPromise()
        .then(result => result.nickname);
    }

    public getRepositories(workspace: string, seasonStartDate: Date): Promise<Array<BitbucketRepository>> {
        const params = new HttpParams().set("fields", BitbucketApiConstants.FIELDS_REPO)
            .set("updated_on>", seasonStartDate.toISOString())
            .set("sort", BitbucketApiConstants.SORT_RULE);
        let url = BitbucketApiConstants.REPOSITORIES_BASE_URL + workspace;
        return this.http.get<BitbucketRepositoryResponse>(url, { params: params, headers: this.headers })
        .toPromise()
            .then(val => {
                this.log.d("The values are", val);
                return val.values;
            });
    }

    public getReposlug(workspace: string, repo_slug: string): Promise<BitbucketCommitResponse> {
        const params = new HttpParams().set("fields", BitbucketApiConstants.FIELDS_COMMITS);

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
        const params = new HttpParams().set("state", BitbucketApiConstants.PULLREQUEST_STATE)
            .set("sort", BitbucketApiConstants.SORT_RULE)
            .set("fields", BitbucketApiConstants.FIELDS_PULLREQUESTS);

        let url = BitbucketApiConstants.REPOSITORIES_BASE_URL + workspace + "/" + repo_slug + "/pullrequests/";

        return this.http.get<BitbucketPullRequestResponse>(url, { params: params, headers: this.headers }).toPromise()
            .then(val => {
                this.log.d("The values are from pull request", val);
                return val;
            });
    }

    public getPRCommits(url: string): Promise<BitbucketPRCommitsResponse> {
        const params = new HttpParams().set("fields", BitbucketApiConstants.FIELDS_PULLREQUEST_COMMITS);
        return this.http.get<BitbucketPRCommitsResponse>(url, { params: params, headers: this.headers }).toPromise()
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

    public getWorkSpaces(): Promise<Array<string>> {
        let url = AppConfig.SERVER_BASE_URL + "/config";
        return this.http.get<BitbucketApiEnvConfig>(url).toPromise().then(env => {
            return env.BITBUCKET_WORKSPACES.split(",");
        });
    }

    private loginToBitbucket(userAddress: string): Promise<string> {
        this.userIdentifier = userAddress;
        return this.http.get(BitbucketApiConstants.SERVER_AUTHENTICATION_URL + userAddress).toPromise()
        .then((response: IResponse) => {
            if (response.status === AppConfig.STATUS_OK) {
                let url = response.data;
                this.log.d("Opening bitbucket pop-up");
                this.authWindow = window.open(url);
            } else {
                this.log.d("Bitbucket Provider not defined, functionality not available", response);
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
        return this.loginToBitbucket(this.userIdentifier)
        .then(authUrl => {
            this.log.d("Refreshing token", authUrl);
            return authUrl;
        }).catch(e => {
            this.log.e("Bitbucket Provider not defined, functionality not available");
            throw e;
        });
    }

    private setNewTokenHeader(userToken: string) {
        this.headers = new HttpHeaders({
            "Authorization": "Bearer " + userToken
        });
    }
}
