import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";
import { AppConfig } from "../app.config";
import { AddCommitPopover } from "../pages/addcommit/addcommit";
import { PopoverController } from "ionic-angular";
import { IResponse } from "../models/response.model";
import { LoggerService, ILogger } from "../core/logger.service";
import { Repository } from "../models/repository.model";
import { BitbucketCommitResponse } from "../models/commit-info.model";

@Injectable()
export class BitbucketService {

    private bearHash: string;
    private userToken: string;
    private userIdentifier: string;
    private headers: HttpHeaders;
    private log: ILogger;

    constructor(
        private http: HttpClient,
        private storageSrv: LocalStorageService,
        private popoverCtrl: PopoverController,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("BitbucketService");
        this.userToken = this.getToken();
        this.headers = new HttpHeaders({
            "Authorization": "Bearer " + this.bearHash
        });
    }

    public loginToBitbucket(userAddress: string): Promise<string> {
        this.userIdentifier = userAddress;
        return this.http.get(AppConfig.SERVER_BITBUCKET_AUTHENTICATION_URL + userAddress).toPromise()
        .then((response: IResponse) => response.data);
    }

    public setUserAddress(userAddress: string) {
        this.userIdentifier = userAddress;
    }

    public async getUsername(): Promise<string> {
        const params = new HttpParams().set("fields", "nickname");
        const val = await this.http.get(AppConfig.BITBUCKET_USER_URL, { params: params, headers: this.headers }).toPromise();
        return val["nickname"];
    }

    public getRepositories(seasonStartDate: Date): Promise<Array<Repository>> {
        const params = new HttpParams().set("fields", "values.name,values.slug")
            .set("updated_on>", seasonStartDate.toISOString())
            .set("sort", "-updated_on");
    
        return this.http.get(AppConfig.BITBUCKET_REPOSITORIES_URL, { params: params, headers: this.headers }).toPromise()
            .then(val => {
                return val["values"];
            });
    }

    public getReposlug(repo_slug: string): Promise<BitbucketCommitResponse> {
        const params = new HttpParams().set("fields", "next,values.author.user,values.date,values.hash,values.message");

        let url = AppConfig.BITBUCKET_REPOSITORIES_URL + repo_slug + "/commits";

        return this.http.get(url, { params: params, headers: this.headers }).toPromise()
            .then((val: BitbucketCommitResponse) => {
                return val;
            });
    }

    public getNextReposlug(url: string): Promise<BitbucketCommitResponse> {
        return this.http.get(url, { headers: this.headers }).toPromise()
            .then((val: BitbucketCommitResponse) => {
                return val;
            });
    }

    public getToken(): string {
        this.bearHash = this.storageSrv.get(AppConfig.StorageKey.BITBUCKETUSERTOKEN);
        return this.bearHash;
    }

    public setUserToken(userToken: string) {
        this.userToken = userToken;
        this.storageSrv.set(AppConfig.StorageKey.BITBUCKETUSERTOKEN, userToken);
        let popover = this.popoverCtrl.create(AddCommitPopover, { authenticationVerified: true }, { cssClass: "add-commit-popover" });
        popover.present();
    }
}
