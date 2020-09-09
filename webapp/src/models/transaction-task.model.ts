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

export class TransactionTask { 
    public resolve: Function;
    public reject: Function;
    public transaction: UnsignedTransaction;

    constructor(resolve: Function, reject: Function, transaction: UnsignedTransaction) {
        this.resolve = resolve;
        this.reject = reject;
        this.transaction = transaction;
    }
}
