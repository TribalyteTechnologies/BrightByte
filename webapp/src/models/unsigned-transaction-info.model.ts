import { Account } from "web3-eth-accounts";

export class UnsignedTransaction { 
    public byteCode: string;
    public contractAddress: string;
    public user: string;

    constructor(byteCode: string, contractAddress: string, user: Account) {
        this.byteCode = byteCode;
        this.contractAddress = contractAddress;
        this.user = user;
    }
}
