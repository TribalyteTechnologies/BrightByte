import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";
import { AppConfig } from "../app.config";
import { AddCommitPopover } from "../pages/addcommit/addcommit";
import { PopoverController } from "ionic-angular";
import { IResponse } from "../models/response.model";

@Injectable()
export class BitbucketService {

    public userDetails = {};
    private bearHash = "";
    private userIdentifier: string;

    constructor(
        private http: HttpClient,
        private storageSrv: LocalStorageService,
        private popoverCtrl: PopoverController
    ) {
        this.bearHash = this.storageSrv.get("bearHash");
    }

    public loginToBitbucket(userAddress: string): Promise<string> {
        this.userIdentifier = userAddress;
        return this.http.get(AppConfig.SERVER_BITBUCKET_AUTHENTICATION_URL + userAddress).toPromise()
        .then((response: IResponse) => response.data);
    }

    public getToken(): string {
        return this.storageSrv.get(AppConfig.StorageKey.USERTOKEN);
    }

    public getUsername(): Promise<Object> {
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.bearHash
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
            "Authorization": "Bearer " + this.bearHash
        });
        return this.http.get(AppConfig.BITBUCKET_REPOSITORIES_URL, { headers }).toPromise()
            .then(val => {
                return val["values"];
            });
    }

    public getReposlug(repo_slug: string): Promise<Object> {
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.bearHash
        });

        let url = AppConfig.BITBUCKET_REPOSITORIES_URL + repo_slug + "/commits";

        return this.http.get(url, { headers }).toPromise().then(val => {
            return val;
        });
    }

    public getNextReposlug(url: string): Promise<Object> {
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.bearHash
        });
        return this.http.get(url, { headers }).toPromise().then(val => {
            return val;
        });
    }

    public setUserToken(userToken: string) {
        this.bearHash = userToken;
        this.storageSrv.set(AppConfig.StorageKey.USERTOKEN, userToken);
        let popover = this.popoverCtrl.create(AddCommitPopover, { authenticationVerified: true }, { cssClass: "add-commit-popover" });
        popover.present();
    }
}
