import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";
import { AppConfig } from "../app.config";
import { IOrganizationResponse, IResponse } from "../models/response.model";
import { LoggerService, ILogger } from "../core/logger.service";
import { GithubCommitResponse, GithubPullResponse } from "../models/bitbucket-github/github-commit.model";
import { GithubUserResponse } from "../models/bitbucket-github/github-user.model";
import { PopupService } from "./popup.service";
import { GithubRepositoryResponse} from "../models/bitbucket-github/github-repository-response.model";
import { Repository } from "../models/bitbucket-github/repository.model";
import { CommitInfo } from "../models/bitbucket-github/commit-info.model";
import { BackendGithubConfig } from "../models/backend-github-config.model";
import { PullRequest } from "../models/bitbucket-github/pull-request.model";

export class GithubApiConstants {
    public static readonly SERVER_AUTHENTICATION_URL =  AppConfig.SERVER_BASE_URL + "/authentication/authorize/";
    public static readonly SERVER_SYSTEM_CONFIG_URL = AppConfig.SERVER_BASE_URL + "/team/";
    public static readonly BASE_API_URL = "https://api.github.com/";
    public static readonly BASE_URL = "https://github.com/";
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
    public static readonly REPOSITORIES_ORGS_URL = "https://api.github.com/orgs/";
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
    private githubUser: string;
    private currentVersion: number;

    constructor(
        private http: HttpClient,
        private storageSrv: LocalStorageService,
        private popupSrv: PopupService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("GithubService");
        this.userToken = this.getToken();
        this.setNewHeader(this.userToken);
    }

    public getLoginEmitter(): EventEmitter<boolean> {
        return this.eventEmitter;
    }

    public checkProviderAvailability(userAddress: string, teamUid: number, version: number): Promise<boolean> {
        this.log.d("Checks the github api works correctly");
        this.userIdentifier = userAddress;
        this.userTeamUid = teamUid;
        this.currentVersion = version;
        return this.getUsername().then(name => {
            this.githubUser = name.login;
            this.log.d("The api provider works, the user nickname is:", this.githubUser);
            this.eventEmitter.emit(true);
            return true;
        }).catch(async err => {
            this.log.w("Error getting the provider api:", err);
            let ret = await this.refreshToken();
            this.log.d("The refresh response is", ret);
            return false;
        });
    }

    public getRepositoriesOrg(seasonStartDate: Date, organization: string): Promise<any> {
        const params = new HttpParams().set("type", "all");
        let githubCommits: Array<Repository>;
        let githubRepositories: Array<GithubRepositoryResponse>;
        return this.http.get<Array<GithubRepositoryResponse>>(
            GithubApiConstants.REPOSITORIES_ORGS_URL + organization + "/repos", {params: params, headers: this.headers}).toPromise()
        .then((githubRepos: Array<GithubRepositoryResponse>) => {
            githubRepositories = githubRepos;
            this.log.d("The repositories are", githubRepositories);
            const commits = githubRepositories.map((repo) => this.getCommits(repo, seasonStartDate, organization));
            return Promise.all(commits);
        }).then((commitsResponse: Array<Repository>) => {
            githubCommits = commitsResponse.filter(repo => repo.commitsInfo.length > 0);
            githubRepositories = githubRepositories.filter(repos => githubCommits.filter(repo => repo.name === repos.name).length > 0);
            const pulls = githubRepositories.map((repo) => this.getPullRequests(repo, seasonStartDate, organization));
            return Promise.all(pulls);
        }).then((prResponse: Array<Repository>) => {
            prResponse = prResponse.filter(pr => pr);
            prResponse.forEach((repo, index) => {
                githubCommits[index].pullRequestsNotUploaded = repo.pullRequestsNotUploaded;
                githubCommits[index].pullRequests = repo.pullRequests;   
            });
            return githubCommits;
        }).catch(error => {
            this.log.e("Error getting user organization repositories: ", error);
            throw error;
        });
            
    }

    public getCommits(repository: GithubRepositoryResponse, seasonStartDate: Date, organization: string): Promise<Repository> {
        return this.getUsername().then(userName => {
            this.githubUser = userName.login;
            const params = new HttpParams().set("author", this.githubUser).set("since", seasonStartDate.toISOString().split("+")[0]);
            const url =  GithubApiConstants.BASE_API_URL + "repos/" + organization + "/" + repository.name + "/commits";
            return this.http.get<Array<GithubCommitResponse>>(url, {params: params, headers: this.headers }).toPromise();
        }).then(result => {     
            this.log.d("The getCommits response is", result);
            let commitsRepository  = new Repository(repository.html_url, repository.name, "", organization);
            commitsRepository.commitsInfo = result.map((r) => CommitInfo.fromGithubApi(r));
            return commitsRepository;
        });
    }

    public getPullRequests(repository: GithubRepositoryResponse, seasonStartDate: Date, organization: string): Promise<Repository> {
        this.log.d("The season start date is: ", seasonStartDate);
        let result = new Array<PullRequest>();
        let repoPullRequests: Array<GithubPullResponse>;
        return this.http.get<Array<GithubPullResponse>>(
            GithubApiConstants.BASE_API_URL + "repos/" + organization + "/" + repository.name + "/pulls", 
            { headers: this.headers }).toPromise()
        .then((repoPRs: Array<GithubPullResponse>) => {
            repoPullRequests = repoPRs.filter(pr => pr.user.login === this.githubUser);
            const promises = repoPullRequests.map((pr: GithubPullResponse) => 
                this.http.get<any>(pr.url, { headers: this.headers }).toPromise()
            );
            return Promise.all(promises);
        }).then(res => {
            result = res.map(prGit => new PullRequest(prGit.id, prGit.title, prGit.created_at, prGit.merge_commit_sha));
            const commitPromises = repoPullRequests.map((pr: GithubPullResponse) =>
                this.http.get<GithubCommitResponse>(pr.commits_url, { headers: this.headers }).toPromise()
            );
            return Promise.all(commitPromises);
        }).then((commitsArray: Array<any>) => {
            const commitsPr = commitsArray.map((commits) => commits.map(commit => commit.sha));
            result.forEach((pr, index) => pr.commitsHash = commitsPr[index]);
            let repo = new Repository(repository.html_url, repository.name, "", organization);
            repo.pullRequestsNotUploaded = result;
            return repo;
        }).catch(error => {
            this.log.e("Error getting github pull requests: ", error);
            return null;
        });
    }

    public getUsername(): Promise<GithubUserResponse> {
        this.log.d("The user token is", this.userToken);
        return this.http.get<GithubUserResponse>(GithubApiConstants.GET_USER_URL, { headers: this.headers }).toPromise()
        .then(result => result);
    }

    public setUserToken(userToken: string) {
        this.userToken = userToken;
        this.storageSrv.set(AppConfig.StorageKey.GITHUBUSERTOKEN, userToken);
        if(this.authWindow) {
            this.authWindow.close();
            this.authWindow = null;
        }
        this.setNewHeader(this.userToken);
        this.eventEmitter.emit(true);
    }

    public getTeamBackendConfig(teamUid: number, userAddress: string, version: number): Promise<BackendGithubConfig> {
        let urlCall = GithubApiConstants.SERVER_SYSTEM_CONFIG_URL + teamUid + "/" + version + "/organization/" + userAddress;
        return this.http.get(urlCall).toPromise().then((result: IOrganizationResponse) => new BackendGithubConfig(result.data));
    }

    private loginToGithub(userAddress: string, teamUid: number, version: number): Promise<string> {
        this.userIdentifier = userAddress;
        this.userTeamUid = teamUid;
        this.currentVersion = version;
        const provider = GithubApiConstants;
        const urlAuth = provider.SERVER_AUTHENTICATION_URL + provider.PROVIDER_NAME + "/" + userAddress + "/" + teamUid + "/" + version;
        return this.http.get(urlAuth).toPromise()
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
        return this.loginToGithub(this.userIdentifier, this.userTeamUid, this.currentVersion)
        .then(authUrl => {
            this.log.d("Refreshing token", authUrl);
            return authUrl;
        }).catch(e => {
            this.log.w("Github Provider not defined, feature not available");
            throw e;
        });
    }

    private setNewHeader(userToken: string) {
        this.headers = new HttpHeaders({
            "Authorization": "Bearer " + userToken,
            "Accept": "application/vnd.github.v3+json"
        });
        this.log.d("Github header", this.headers);
    }
}
