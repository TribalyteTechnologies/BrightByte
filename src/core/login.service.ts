import { Injectable } from "@angular/core";

@Injectable()
export class LoginService {

    account: any;
    
    constructor(){
    }
    
    public setAccount(acc){
        this.account = acc;
    }
    public getAccount(){
        return this.account;
    }
}

