import Web3 from "web3";
import { Web3Service } from "./web3.service"
import { BlockTransactions, UserTransactions, ExtendedTransaction, UserStatistics } from "./blockchain-scrapper.models"
import { BlockchainScrapperConfig } from "./blockchain-scrapper.config";
import { FileWriteService } from "./file-write.service";
import { UtilsService } from "./utils.service";

export class CollectDataService {

    private web3: Web3;
    private web3Srv = new Web3Service();
    private fileWriteSrv = new FileWriteService();
    private utilsSrv = new UtilsService();
    private usersTransactions: Array<UserTransactions>;
    private usersStatistics: Array<UserStatistics>;
    constructor() {
        this.web3 = this.web3Srv.openConnection();
        this.usersTransactions = new Array<UserTransactions>();
        this.usersStatistics = new Array<UserStatistics>();
    }

    public start() {
        this.fetchData(BlockchainScrapperConfig.FROM_BLOCK_NUMBER, BlockchainScrapperConfig.TO_BLOCK_NUMBER)
            .then((blockTransactions: Array<BlockTransactions>) => {
                this.getUserTransactions(blockTransactions);
                this.getUserStatistics(this.usersTransactions);
                this.fileWriteSrv.writeToFile(BlockchainScrapperConfig.USER_TX_DATA_FILE_PATH, JSON.stringify(this.usersTransactions));
                this.fileWriteSrv.writeToFile(BlockchainScrapperConfig.USER_STATISTICS_FILE_PATH, JSON.stringify(this.usersStatistics));
            });
    }

    private fetchData(initBlock: number, endBlock: number): Promise<Array<BlockTransactions>> {
        let blocks = new Array<Promise<any>>();
        let txObtained = 0
        let blockTransactions: Array<BlockTransactions>;
        for (let i = initBlock; i < endBlock; i++) {
            blocks.push(this.web3.eth.getBlock(i).then((blockInfo) => {
                console.log("Obtained block " + txObtained++ + " out of " + (endBlock - initBlock) + " TXs");
                return blockInfo.transactions.length !== 0 ? new BlockTransactions(i, blockInfo.transactions) : null;
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
            .then((txsInfo: Array<Array<ExtendedTransaction>>) => {
                for (let i = 0; i < txsInfo.length; i++) {
                    blockTransactions[i].transactions = txsInfo[i];
                }
                console.log("All transactions between block " + initBlock + " and " + endBlock + " has been obtained.");
                return blockTransactions;
            })
    }

    private getUserStatistics(UserTransactions: Array<UserTransactions>) {
        this.usersStatistics = this.usersTransactions.map(
            (userTxs: UserTransactions) => {
                let firstBlock = Math.min(...userTxs.transactions.map(tx => tx.blockNumber));
                let destinataries = userTxs.transactions.map(tx => tx.to);
                let destinationStas = this.utilsSrv.getMostRepeatedValue(destinataries);
                return new UserStatistics(
                    userTxs.userAddress, userTxs.transactions.length, firstBlock, destinationStas.mostRepeatedVal, destinationStas.numOfRepetitions, [...new Set(destinataries)]);
            });
        console.log("All user statistics has been obtained.");
    }

    private getUserTransactions(blockTransactions: Array<BlockTransactions>) {
        blockTransactions.map((blockTxs: BlockTransactions) => {
            blockTxs.transactions.map((tx: ExtendedTransaction) => {
                let currentTx = tx;
                let user = this.usersTransactions.filter(user => user.userAddress === tx.from)[0];
                currentTx.inputAscii = this.utilsSrv.convertHexToAscii(
                    currentTx.input, BlockchainScrapperConfig.MINIMUM_CHAR_CODE, BlockchainScrapperConfig.MAXIMUM_CHAR_CODE);
                if (user) {
                    let index = this.usersTransactions.indexOf(user);
                    this.usersTransactions[index].transactions.push(currentTx);
                } else {
                    let newUser = new UserTransactions(currentTx.from);
                    newUser.transactions.push(currentTx);
                    this.usersTransactions.push(newUser);
                }
            })
        });
        console.log("All user transactions has been obtained.");
    }
}
