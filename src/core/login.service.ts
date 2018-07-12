import { Injectable } from "@angular/core";

export class UserAccount { //TODO: extend web3 Account interface?
    public address: string;
    public privateKey: string;
    public publicKey: string;
}

@Injectable()
export class LoginService {

    private account: UserAccount;

    public setAccount(acc: UserAccount) {
        this.account = acc;
    }

    public getAccount(): UserAccount {
        return this.account;
    }

}
