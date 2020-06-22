import Web3 from "web3";
import * as fs from 'fs';
import { Web3Service } from "./web3.service"
import { BlockTransactions, UserTransactions } from "./blockchain-scrapper.models"
import { Transaction } from "web3/eth/types";
import { BlockchainScrapperConfig } from "./blockchain-scrapper.config";

export class CollectDataService {

    private web3: Web3;
    private web3Service = new Web3Service();
    private usersTransactions: Array<UserTransactions>;
    constructor() {
        this.web3 = this.web3Service.openConnection();
        this.usersTransactions = new Array<UserTransactions>();
    }

    public start() {
        this.fetchData(BlockchainScrapperConfig.FROM_BLOCK_NUMBER, BlockchainScrapperConfig.TO_BLOCK_NUMBER)
        .then((blockTransactions: Array<BlockTransactions>) => {
            this.getUserTransactions(blockTransactions);
            fs.writeFile(BlockchainScrapperConfig.USER_FILE_PATH, JSON.stringify(this.usersTransactions), function(err) {
                if (err) {
                    console.error("Error writting to file: " + err);
                }
            });
            console.log("User transaction file created");
        });
    }

    private fetchData(initBlock: number, endBlock: number): Promise<Array<BlockTransactions>>{
        let blocks = new Array<Promise<any>>();
        let txObtained = 0
        let blockTransactions: Array<BlockTransactions>;
        for(let i = initBlock; i < endBlock; i++) {
            blocks.push(this.web3.eth.getBlock(i).then((blockInfo) => {
                console.log("Obtained block " + txObtained++ + " out of " + (endBlock-initBlock) + " TXs");
                return blockInfo.transactions.length !== 0 ? new BlockTransactions(i , blockInfo.transactions): null;
            }));
        }
        return Promise.all(blocks)
        .then((blocksTxs: Array<BlockTransactions>) => {
            blockTransactions = blocksTxs.filter(blockTx => blockTx);
            let blockTxsInfo = blockTransactions.map(blockTx => {
                let proms = blockTx.transactionHashes.map((tx) => {
                    return this.web3.eth.getTransaction(tx);
                });
                return Promise.all(proms);
            });
            return Promise.all(blockTxsInfo);
        })
        .then((txsInfo: Array<Array<Transaction>>) => {
            for (let i = 0; i < txsInfo.length; i++){
                blockTransactions[i].transactions = txsInfo[i];
            }
            console.log("All transactions between block " + initBlock + " and " + endBlock + " has been obtained.");
            return blockTransactions;
        })
    }

    private getUserTransactions(blockTransactions: Array<BlockTransactions>) {
        blockTransactions.map((blockTxs: BlockTransactions) => {
            blockTxs.transactions.map((tx: Transaction) => {
                let user = this.usersTransactions.filter(user => user.userAddress === tx.from)[0];
                if (user) {
                    let index = this.usersTransactions.indexOf(user);
                    this.usersTransactions[index].transactions.push(tx);
                } else {
                    let newUser = new UserTransactions(tx.from);
                    newUser.transactions.push(tx);
                    this.usersTransactions.push(newUser);
                }
            })
        });
        console.log("All user transactions has been obtained.");
    }
}
