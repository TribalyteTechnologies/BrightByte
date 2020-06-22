import { Transaction } from "web3/eth/types";

export class UserTransactions {
    public userAddress: string;
    public transactions: Array<Transaction>;
    
    constructor(userAdress: string) {
        this.userAddress = userAdress;
        this.transactions = new Array<Transaction>();
    }
}

export class BlockTransactions {
    public blockNumber: number;
    public transactionHashes: Array<string>;
    public transactions: Array<Transaction>;
    
    constructor(blockNumber: number, transactionHashes: Array<string>) {
        this.blockNumber = blockNumber;
        this.transactionHashes = transactionHashes;
    }
}
