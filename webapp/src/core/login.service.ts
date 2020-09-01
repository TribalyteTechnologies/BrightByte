import { Injectable } from "@angular/core";
import { Account } from "web3-eth-accounts";

@Injectable()
export class LoginService {

    private account: Account;
    private teamUid: number;

    public setAccount(acc: Account) {
        this.account = acc;
    }

    public setTeamUid(teamUid: number) {
        this.teamUid = teamUid;
    }

    public getAccount(): Account {
        return this.account;
    }

    public getAccountAddress(): string {
        return this.account.address;
    }

    public getTeamUid() {
        return this.teamUid;
    }
}
