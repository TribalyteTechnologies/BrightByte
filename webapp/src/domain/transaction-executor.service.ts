import { Injectable } from "@angular/core";
import { UnsignedTransaction, TransactionTask } from "../models/transaction-task.model";
import { TransactionReceipt } from "web3-core";
import { ILogger, LoggerService } from "../core/logger.service";
import { AppConfig } from "../app.config";
import Tx from "ethereumjs-tx";
import { default as Web3 } from "web3";
import { Web3Service } from "../core/web3.service";
import { Account } from "web3-eth-accounts";

@Injectable()
export class TransactionExecutorService {

    private queue: Array<TransactionTask>;
    private log: ILogger;
    private web3: Web3;
    private pendingPromise: boolean;

    constructor(
        loggerSrv: LoggerService,
        web3Service: Web3Service
    ) {
        this.log = loggerSrv.get("TransactionExecutorService");
        this.web3 = web3Service.getWeb3();
        this.queue = new Array<TransactionTask>();
    }

    public enqueue(bytecodeData: string, contractAddress: string, user: Account): Promise<void> {
        const transaction = new UnsignedTransaction(bytecodeData, contractAddress, user);
        return new Promise((resolve, reject) => {
            this.queue.push(new TransactionTask(resolve, reject, transaction));
            this.executeAsync();
        });
    }

    public checkProcessPending(): boolean {
        return this.pendingPromise || this.queue.length > 0;
    }

    private async executeAsync(): Promise<void> {
        for(let item = this.queue.shift(); !!item; item = this.queue.shift()) {
            try {
                this.pendingPromise = true;
                let value = await this.sendTx(item.transaction);
                this.pendingPromise = false;
                this.log.d("The transaction is completed");
                item.resolve(value);
            } catch (err) {
                this.pendingPromise = false;
                this.log.e("Error executing the transaction: ", err); 
                item.reject(err);
            }
        }
    }

    private sendTx(transaction: UnsignedTransaction): Promise<void | TransactionReceipt> {
        return this.web3.eth.getTransactionCount(transaction.user.address, "pending")
            .then(nonceValue => {
                let nonce = "0x" + (nonceValue).toString(16);
                this.log.d("Nonce value", nonce);
                let networkConfig = AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX];
                let rawtx = {
                    nonce: nonce,
                    gasPrice: this.web3.utils.toHex(networkConfig.gasPrice),
                    gasLimit: this.web3.utils.toHex(networkConfig.gasLimit),
                    to: transaction.contractAddress,
                    data: transaction.byteCode
                };
                const tx = new Tx(rawtx);
                let priv = transaction.user.privateKey.substring(2);
                let privateKey = new Buffer(priv, "hex");
                tx.sign(privateKey);

                let raw = "0x" + tx.serialize().toString("hex");
                this.log.d("Rawtx: ", rawtx);
                this.log.d("Raw: ", raw);
                this.log.d("tx unsign: ", tx);
                return this.web3.eth.sendSignedTransaction(raw);
            }).then(transactionHash => {
                this.log.d("Hash transaction", transactionHash);
                return transactionHash;
            }).catch(e => {
                this.log.e("Error in transaction (sendTx function): ", e);
                throw e;
            });
    }
}
