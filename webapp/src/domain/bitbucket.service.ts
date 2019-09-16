import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { LocalStorageService } from "../core/local-storage.service";

@Injectable()
export class BitbucketService {
    public userDetails = {};
    private bearHash = "";

    constructor(private http: HttpClient, private storageSrv: LocalStorageService) {
        this.bearHash = this.storageSrv.get("bearHash");
    }

    public loginUser(username: string, password: string): Promise<boolean>{
        const URL = "https://bitbucket.org/site/oauth2/access_token";
        const CLIENT_ID_INPUT = "aNL9fDU2C7uzV7tnfz";
        const CLIENT_SECRET_INPUT = "AmByJXU7PvejHndAn9JAGUnJ4VUmMLvj";
        const body = new FormData();
        body.append("grant_type", "password");
        body.append("username", username);
        body.append("password", password);
        body.append("client_id", CLIENT_ID_INPUT);
        body.append("client_secret", CLIENT_SECRET_INPUT);
    
        
        return new Promise((resolve, reject) => {
            this.http.post(URL, body).subscribe((resp) => {
                this.bearHash = resp["access_token"];
                this.storageSrv.set("bearHash", this.bearHash);
                resolve(true);
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
            let url = "https://api.bitbucket.org/2.0/repositories/" + "tribalyte";
            this.http.get(url, { headers }).subscribe(val => {
            resolve(val["values"]);
        });
    });
    }

    public getReposlug(repo_slug: string): Promise<any>{
        const headers = new HttpHeaders({
            "Authorization": "Bearer " + this.bearHash
            });
        return new Promise(resolve => {
            let url = "https://api.bitbucket.org/2.0/repositories/tribalyte/" + repo_slug + "/commits/";
            this.http.get(url, { headers }).subscribe(val => {
            resolve(val);
            });
        });
    }
}
