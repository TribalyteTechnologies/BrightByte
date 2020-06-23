import { Transaction } from "web3/eth/types";

export class UserTransactions {
    public userAddress: string;
    public transactions: Array<ExtendedTransaction>;
    
    constructor(userAdress: string) {
        this.userAddress = userAdress;
        this.transactions = new Array<ExtendedTransaction>();
    }
}

export class UserStatistics {
    public userAddress: string;
    public numberOfTransactions: number;
    public firstTransactionBlockNumber: number;
    public preferedTransactionDestination: string;
    public numberOfTransactionToPreferedDestiantion: number;
    public transactionDestiantions: Array<string>; 

    constructor(userAdress: string, numberOfTransactions?: number, 
                firstTransactionBlockNumber?: number, preferedTransactionDestination?: string,
                numberOfTransactionToPreferedDestiantion?: number, transactionDestiantions?: Array<string>) {
        this.userAddress = userAdress;
        this.numberOfTransactions = numberOfTransactions;
        this.firstTransactionBlockNumber = firstTransactionBlockNumber;
        this.transactionDestiantions = transactionDestiantions;
        this.preferedTransactionDestination = preferedTransactionDestination;
        this.numberOfTransactionToPreferedDestiantion = numberOfTransactionToPreferedDestiantion;
    }
}

export class RepetitionStatistics {
    public mostRepeatedVal: string;
    public numOfRepetitions: number;
    
    constructor(mostRepeatedVal: string, numberOfRepetitions) {
        this.mostRepeatedVal = mostRepeatedVal;
        this.numOfRepetitions = numberOfRepetitions;
    }
}

export class ExtendedTransaction implements Transaction {
    public hash: string;
    public nonce: number;
    public blockHash: string;
    public blockNumber: number;
    public transactionIndex: number;
    public from: string;
    public to: string;
    public value: string;
    public gasPrice: string;
    public gas: number;
    public input: string;
    public inputAscii?: string;
    public v?: string;
    public r?: string;
    public s?: string;
}

export class BlockTransactions {
    public blockNumber: number;
    public transactionHashes: Array<string>;
    public transactions: Array<ExtendedTransaction>;
    
    constructor(blockNumber: number, transactionHashes: Array<string>) {
        this.blockNumber = blockNumber;
        this.transactionHashes = transactionHashes;
    }
}
