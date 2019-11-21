import { Injectable } from "@angular/core";
import { Account } from "web3/types";

@Injectable()
export class LoginService {

    private account: Account;

    public setAccount(acc: Account) {
        this.account = acc;
    }

    public getAccount(): Account {
        return this.account;
    }

    public getAccountAddress(): string {
        return this.account.address;
    }

}
