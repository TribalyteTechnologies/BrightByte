import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";
import { AppConfig } from "../app.config";
import { IResponse } from "../models/response.model";
import { LoggerService, ILogger } from "../core/logger.service";
import { BitbucketRepository, BitbucketRepositoryResponse } from "../models/repository.model";
import { BitbucketCommitResponse, BitbucketUserInfo } from "../models/commit-info.model";
import { BitbucketPullRequestResponse, BitbucketPRCommitsResponse } from "../models/pull-request.model";

export class BitbucketApiConstants{
    public static readonly SERVER_AUTHENTICATION_URL =  AppConfig.SERVER_BASE_URL + "/authentication/authorize/";
    public static readonly BASE_URL = "https://bitbucket.org/";
    public static readonly USER_BASE_URL = "https://api.bitbucket.org/2.0/user/";
    public static readonly REPOSITORIES_BASE_URL = "https://api.bitbucket.org/2.0/repositories/";
    public static readonly WORKSPACE = "tribalyte/";
    public static readonly SORT_RULE = "-updated_on";
    public static readonly FIELDS_USER = "nickname";
    public static readonly FIELDS_REPO = "values.name,values.slug";
    public static readonly FIELDS_COMMITS = "next,values.author.user,values.date,values.hash,values.message,values.parents.hash";
    public static readonly FIELDS_PULLREQUESTS = "next,values.author.nickname,values.title,values.destination.commit.hash,values.links.commits.href,values.updated_on,values.id";
    public static readonly FIELDS_PULLREQUEST_COMMITS = "next,values.hash";
    public static readonly PULLREQUEST_STATE = "MERGED,OPEN";
}

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

    public checkProviderAvailability(userAddress: string): Promise<boolean> {
        this.log.d("Checks the api works correctly");
        this.userIdentifier = userAddress;
        return this.getUsername().then(name => {
            this.log.d("The api provider works, the user nickname is:", name);
            this.eventEmitter.emit(true);
            return true;
        }).catch(err => {
            this.log.e("Error getting with provider api:", err);
            this.refreshToken();
            return false;
        });
    }

    public getUsername(): Promise<string> {
        const params = new HttpParams().set("fields", BitbucketApiConstants.FIELDS_USER);
        this.log.d("The user token is", this.userToken);
        return this.http.get<BitbucketUserInfo>(BitbucketApiConstants.USER_BASE_URL, { params: params, headers: this.headers }).toPromise()
        .then(result => {
            return result.nickname;
        });
    }

    public getRepositories(seasonStartDate: Date): Promise<Array<BitbucketRepository>> {
        const params = new HttpParams().set("fields", BitbucketApiConstants.FIELDS_REPO)
            .set("updated_on>", seasonStartDate.toISOString())
            .set("sort", BitbucketApiConstants.SORT_RULE);
        let url = BitbucketApiConstants.REPOSITORIES_BASE_URL + BitbucketApiConstants.WORKSPACE;
        return this.http.get<BitbucketRepositoryResponse>(url, { params: params, headers: this.headers })
        .toPromise()
            .then(val => {
                this.log.d("The values are", val);
                return val.values;
            });
    }

    public getReposlug(repo_slug: string): Promise<BitbucketCommitResponse> {
        const params = new HttpParams().set("fields", BitbucketApiConstants.FIELDS_COMMITS);

        let url = BitbucketApiConstants.REPOSITORIES_BASE_URL + BitbucketApiConstants.WORKSPACE + repo_slug + "/commits";

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

    public getPullRequests(repo_slug: string): Promise<BitbucketPullRequestResponse> {
        const params = new HttpParams().set("state", BitbucketApiConstants.PULLREQUEST_STATE)
            .set("sort", BitbucketApiConstants.SORT_RULE)
            .set("fields", BitbucketApiConstants.FIELDS_PULLREQUESTS);

        let url = BitbucketApiConstants.REPOSITORIES_BASE_URL + BitbucketApiConstants.WORKSPACE + repo_slug + "/pullrequests/";

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
        if(this.windowInstance) {
            this.windowInstance.close();
        }
        this.setNewTokenHeader(this.userToken);
        this.eventEmitter.emit(true);
    }

    private loginToBitbucket(userAddress: string): Promise<string> {
        this.userIdentifier = userAddress;
        return this.http.get(BitbucketApiConstants.SERVER_AUTHENTICATION_URL + userAddress).toPromise()
        .then((response: IResponse) => {
            let url = response.data;
            this.log.d("Opening bitbucket pop-up");
            this.windowInstance = window.open(url);
            return response.data;
        });
    }

    private getToken(): string {
        this.userToken = this.storageSrv.get(AppConfig.StorageKey.BITBUCKETUSERTOKEN);
        return this.userToken;
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
