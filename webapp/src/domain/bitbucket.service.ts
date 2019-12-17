import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";
import { AppConfig } from "../app.config";

@Injectable()
export class BitbucketService {
    public userDetails = {};
    private bearHash = "";

    constructor(private http: HttpClient, private storageSrv: LocalStorageService) {
        this.bearHash = this.storageSrv.get("bearHash");
    }

    public loginBitbucket(): Promise<any> {
        let usercode = Math.random().toString(36).substr(2, 9);
        let URL = AppConfig.SERVER_BASE_URL + "/authentication/authorize/" + usercode;
        return new Promise((resolve, reject) => {
            this.http.get(URL).subscribe((resp) => {
                resolve(resp);
            });
        });
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
}
