import Web3 from "web3";
import { Web3Service } from "./web3.service"
import { BlockTransactions, UserTransactions, ExtendedTransaction, UserStatistics } from "./blockchain-scrapper.models"
import { BlockchainScrapperConfig } from "./blockchain-scrapper.config";
import { FileWriteService } from "./file-write.service";
import { UtilsService } from "./utils.service";
import { Block } from "web3/eth/types";

export class CollectDataService {

    private readonly SEG_TO_MILLIS = 1000;

    private web3: Web3;
    private web3Srv = new Web3Service();
    private fileWriteSrv = new FileWriteService();
    private utilsSrv = new UtilsService();
    private usersTransactions: Array<UserTransactions>;
    private usersStatistics: Array<UserStatistics>;
    private rawBlocks = new Array<Block>();
    constructor() {
        this.web3 = this.web3Srv.openConnection();
        this.usersTransactions = new Array<UserTransactions>();
        this.usersStatistics = new Array<UserStatistics>();
    }

    public start() {
        this.fetchData(BlockchainScrapperConfig.FROM_BLOCK_NUMBER, BlockchainScrapperConfig.TO_BLOCK_NUMBER)
            .then((blockTransactions: Array<BlockTransactions>) => {
                this.getUserTransactions(blockTransactions);
                this.getUserStatistics();
                this.filterUserStatistics();
                this.fileWriteSrv.writeToFile(BlockchainScrapperConfig.USER_TX_DATA_FILE_PATH, JSON.stringify(this.usersTransactions));
                this.fileWriteSrv.writeToFile(BlockchainScrapperConfig.USER_STATISTICS_FILE_PATH, JSON.stringify(this.usersStatistics));
            });
    }

    private fetchData(initBlock: number, endBlock: number): Promise<Array<BlockTransactions>> {
        let blocks = new Array<Promise<any>>();
        let txObtained = 0
        let blockTransactions: Array<BlockTransactions>;
        for (let i = initBlock; i < endBlock; i++) {
            blocks.push(this.web3.eth.getBlock(i).then((blockInfo: Block) => {
                this.rawBlocks.push(blockInfo);
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
                console.log("All transactions between block " + initBlock + " and " + endBlock + " have been obtained.");
                return blockTransactions;
            })
    }

    private getUserStatistics() {
        this.usersStatistics = this.usersTransactions.map(
            (userTxs: UserTransactions) => {
                let firstBlock = Math.min(...userTxs.transactions.map(tx => tx.blockNumber));
                let firstBlockDate = this.getTransactionDate(firstBlock);
                let destinataries = userTxs.transactions.map(tx => tx.to);
                let destinationStas = this.utilsSrv.getMostRepeatedValue(destinataries);
                return new UserStatistics(
                    userTxs.userAddress, userTxs.transactions.length, firstBlock, firstBlockDate, destinationStas.mostRepeatedVal, destinationStas.numOfRepetitions, [...new Set(destinataries)]);
            });
        console.log("All user statistics have been obtained.");
    }

    private filterUserStatistics() {
        this.usersStatistics = this.usersStatistics
        .filter((userStats: UserStatistics) => 
            userStats.numberOfTransactions >= BlockchainScrapperConfig.MINIMUN_NUMBER_OF_TX_TO_SHOW)
        .filter((userStats: UserStatistics) => 
            userStats.numberOfTransactionToPreferedDestiantion >= BlockchainScrapperConfig.MINIMUN_NUMBER_OF_TX_TO_PREFERED_DESTINATION);
        let filteredUserAddresses = this.usersStatistics.map((userStats: UserStatistics) => userStats.userAddress);
        this.usersTransactions = this.usersTransactions
        .filter((userTxs: UserTransactions) => filteredUserAddresses.some((address: string) => address === userTxs.userAddress));
        console.log("All user statistics have been filtered.");
    }

    private getTransactionDate(blockNumber: number) {
        let firstBlockTimestamp = this.rawBlocks.filter((block: Block) => block.number === blockNumber)[0].timestamp;
        return new Date(firstBlockTimestamp * this.SEG_TO_MILLIS);
    }

    private getUserTransactions(blockTransactions: Array<BlockTransactions>) {
        blockTransactions.map((blockTxs: BlockTransactions) => {
            blockTxs.transactions.map((tx: ExtendedTransaction) => {
                let currentTx = tx;
                let user = this.usersTransactions.filter(user => user.userAddress === tx.from)[0];
                currentTx.inputAscii = this.utilsSrv.convertHexToAscii(
                    currentTx.input, BlockchainScrapperConfig.MINIMUM_CHAR_CODE, BlockchainScrapperConfig.MAXIMUM_CHAR_CODE);
                currentTx.transactionDate = this.getTransactionDate(currentTx.blockNumber);
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
        console.log("All user transactions have been obtained.");
    }
}
