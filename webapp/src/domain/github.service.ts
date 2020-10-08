import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";
import { AppConfig } from "../app.config";
import { IResponse } from "../models/response.model";
import { LoggerService, ILogger } from "../core/logger.service";
import { GithubCommitResponse } from "../models/github/commit.model";
import { GithubUserResponse } from "../models/github/user.model";
import { PopupService } from "./popup.service";
import { GithubEvent, CommitInfo } from "../models/github/repository.model";

export class GithubApiConstants {
    public static readonly SERVER_AUTHENTICATION_URL =  AppConfig.SERVER_BASE_URL + "/authentication/authorize/";
    public static readonly BASE_URL = "https://api.github.com/";
    public static readonly GET_USER_URL = "https://api.github.com/user";
    public static readonly USER_BASE_URL = "https://api.github.com/users/";
    public static readonly EVENTS_URL = "/events";
    public static readonly PUSH_EVENT_TYPE = "PushEvent";
    public static readonly PR_EVENT_TYPE = "PullRequestEvent";
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
    public static readonly PROVIDER_NAME = "github";
    public static readonly REPOSITORIES_BASE_URL = "https://api.github.com/user/repos";
}

@Injectable()
export class GithubService {
    private userToken: string;
    private userIdentifier: string;
    private userTeamUid: number;
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
        this.log = loggerSrv.get("GithubService");
        this.userToken = this.getToken();
        this.setNewTokenHeader(this.userToken);
    }

    public getLoginEmitter(): EventEmitter<boolean> {
        return this.eventEmitter;
    }

    public checkProviderAvailability(userAddress: string, teamUid: number): Promise<boolean> {
        this.log.d("Checks the api works correctly");
        this.userIdentifier = userAddress;
        this.userTeamUid = teamUid;
        return this.getUsername().then(name => {
            this.log.d("The api provider works, the user nickname is:", name.login);
            this.eventEmitter.emit(true);
            return true;
        }).catch(async err => {
            this.log.e("Error getting the provider api:", err);
            let ret = await this.refreshToken();
            this.log.d("The refresh response is", ret);
            return false;
        });
    }

    public getRepositories(userName: string, seasonStartDate: Date): Promise<any> {
        return this.getPushEvents(userName, GithubApiConstants.PUSH_EVENT_TYPE, seasonStartDate)
        .then((result: Array<GithubEvent>) => {
            let promises = result.map(event => this.managePushEvents(event));
            return Promise.all(promises);
        }).catch(e => {
            this.log.e("Error en el get repos", e);
        });
    }

    public getPrCommits(workspace: string, seasonStartDate: Date): Promise<Array<GithubCommitResponse>> {
        const params = new HttpParams().set("author", "Pcamachoc").set("since", "2020-09-05T00:00:00Z");
        this.log.d("The user token is", this.userToken);
        this.log.d("params", params);
        return this.http.get<Array<GithubCommitResponse>>(
            "https://api.github.com/repos/TribalyteTechnologies/BrightByte/commits", {params: params, headers: this.headers }).toPromise()
        .then(result => {
            this.log.d("The getPrCommits response is", result);
            return result;
        });
    }

    public getUsername(): Promise<GithubUserResponse> {
        this.log.d("The user token is", this.userToken);
        return this.http.get<GithubUserResponse>(GithubApiConstants.GET_USER_URL, {headers: this.headers }).toPromise()
        .then(result => {
            this.log.d("The GetUserName response is", result);
            return result;
        });
    }

    public setUserToken(userToken: string) {
        this.userToken = userToken;
        this.storageSrv.set(AppConfig.StorageKey.GITHUBUSERTOKEN, userToken);
        if(this.authWindow) {
            this.authWindow.close();
            this.authWindow = null;
        }
        this.setNewTokenHeader(this.userToken);
        this.eventEmitter.emit(true);
    }

    private managePushEvents(event: GithubEvent): Promise<Array<CommitInfo>> {
        const userLogin = event.actor.login;
        const getRepoUrl = event.repo.url;
        const eventCommits = event.payload.commits;
        let userCommits = eventCommits.filter(commit => userLogin === commit.author.name);

        return this.http.get<any>(getRepoUrl).toPromise()
        .then((result: any) => {
            const repoUrl = result.html_url;
            let commits = userCommits.map(commit => new CommitInfo(commit.sha, commit.message, repoUrl));
            return commits;
        });
    }

    private getPushEvents(userName: string, eventType: string, seasonStartDate: Date): Promise<Array<GithubEvent>> {
        const getEventeUrl = GithubApiConstants.USER_BASE_URL + userName + GithubApiConstants.EVENTS_URL;
        return this.http.get<Array<GithubEvent>>(getEventeUrl).toPromise()
        .then((result: Array<GithubEvent>) => {
            const ret = result.filter((event: GithubEvent) => {
                let dateEvent = new Date(event.created_at);
                return  event.type === eventType && dateEvent > seasonStartDate;
            });
            return ret;
        });
    }

    private loginToGithub(userAddress: string, teamUid: number): Promise<string> {
        this.userIdentifier = userAddress;
        this.userTeamUid = teamUid;
        const provider = GithubApiConstants;
        return this.http.get(provider.SERVER_AUTHENTICATION_URL + provider.PROVIDER_NAME + "/" + userAddress + "/" + teamUid).toPromise()
        .then((response: IResponse) => {
            if (response.status === AppConfig.STATUS_OK) {
                let url = response.data;
                this.log.d("Opening github pop-up");
                this.popupSrv.openUrlNewTab(url)
                .then((tab: Window) => {
                    this.authWindow = tab;
                });
            } else {
                this.log.w("Github Provider not defined, feature not available", response);
                throw new Error(response.data);
            }
            return response.data;
        });
    }

    private getToken(): string {
        return  this.storageSrv.get(AppConfig.StorageKey.GITHUBUSERTOKEN);
    }

    private refreshToken(): Promise<string> {
        this.log.d("Token experied, getting a new one for user: " + this.userIdentifier);
        return this.loginToGithub(this.userIdentifier, this.userTeamUid)
        .then(authUrl => {
            this.log.d("Refreshing token", authUrl);
            return authUrl;
        }).catch(e => {
            this.log.e("Github Provider not defined, feature not available");
            throw e;
        });
    }

    private setNewTokenHeader(userToken: string) {
        this.headers = new HttpHeaders({
            "Authorization": "Bearer " + userToken
        });
        this.log.d("Github header", this.headers);
    }
}
