import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";
import { AppConfig } from "../app.config";
import { AddCommitPopover } from "../pages/addcommit/addcommit";
import { PopoverController } from "ionic-angular";
import { IResponse } from "../models/response.model";

@Injectable()
export class BitbucketService {

    public readonly AUTHENTICATION_URL =  AppConfig.SERVER_BASE_URL + "/authentication/authorize/";

    public userDetails = {};
    private bearHash = "";

    constructor(
        private http: HttpClient,
        private storageSrv: LocalStorageService,
        private popoverCtrl: PopoverController
    ) {
        this.bearHash = this.storageSrv.get("bearHash");
    }

    public loginBitbucket(userAddress: string): Promise<string> {
        return this.http.get(this.AUTHENTICATION_URL + userAddress).toPromise()
        .then((response: IResponse) => response.data);
    }

    public getUsername(): Promise<any> {
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.bearHash
        });
        return new Promise(resolve => {
            this.http
                .get("https://api.bitbucket.org/2.0/user/", { headers })
                .subscribe(val => {
                    resolve(val);
                    this.userDetails = val;
                });
        });
    }

    public getRepositories(): Promise<Array<any>> {
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.bearHash
        });
        return new Promise(resolve => {
            let url = "https://api.bitbucket.org/2.0/repositories/tribalyte";
            this.http.get(url, { headers }).subscribe(val => {
                resolve(val["values"]);
            });
        });
    }

    public getReposlug(repo_slug: string): Promise<any> {
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.bearHash
        });
        return new Promise(resolve => {
            let url = "https://api.bitbucket.org/2.0/repositories/tribalyte/" + repo_slug + "/commits";
            this.http.get(url, { headers }).subscribe(val => {
                resolve(val);
            });
        });
    }

    public getNextReposlug(url: string): Promise<any> {
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.bearHash
        });
        return new Promise(resolve => {
            this.http.get(url, { headers }).subscribe(val => {
                resolve(val);
            });
        });
    }

    public setUserToken(userToken: string) {
        this.bearHash = userToken;
        let popover = this.popoverCtrl.create(AddCommitPopover, { authenticationVerified: true }, { cssClass: "add-commit-popover" });
        popover.present();
    }
}
