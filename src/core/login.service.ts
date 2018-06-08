import { Injectable } from "@angular/core";


export class UserAccount {
    public id: string;
    public name: string;
    public privateKey: string;
}

@Injectable()
export class LoginService {

    private account:any;//: UserAccount;
    
    constructor(){
    }
    
    public setAccount(acc){//: UserAccount){
        this.account = acc;
    }
    public getAccount(){//: UserAccount{
        return this.account;
    }
}

