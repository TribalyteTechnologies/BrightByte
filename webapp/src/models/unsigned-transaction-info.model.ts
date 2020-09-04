import { Account } from "web3-eth-accounts";

export class UnsignedTransaction { 
    public byteCode: string;
    public contractAddress: string;
    public user: Account;

    constructor(byteCode: string, contractAddress: string, user: Account) {
        this.byteCode = byteCode;
        this.contractAddress = contractAddress;
        this.user = user;
    }
}

export class Task { 
    public resolve: any;
    public reject: any;
    public transaction: UnsignedTransaction;

    constructor(resolve: any, reject: any, transaction: UnsignedTransaction) {
        this.resolve = resolve;
        this.reject = reject;
        this.transaction = transaction;
    }
}
