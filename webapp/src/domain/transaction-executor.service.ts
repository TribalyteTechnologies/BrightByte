import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { UnsignedTransaction, TransactionTask } from "../models/transaction-task.model";
import { TransactionReceipt } from "web3-core";
import { ILogger, LoggerService } from "../core/logger.service";
import { AppConfig } from "../app.config";
import Tx from "ethereumjs-tx";
import { default as Web3 } from "web3";
import { Web3Service } from "../core/web3.service";
import { Account } from "web3-eth-accounts";

@Injectable()
export class TransactionExecutorService implements OnDestroy{

    private isProcessingSubj = new BehaviorSubject<boolean>(false);
    private queue: Array<TransactionTask>;
    private log: ILogger;
    private web3: Web3;
    private pendingPromise: boolean;
    private nonceValue: number;

    constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("TransactionExecutorService");
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

    public getProcessingStatus(): Observable<boolean> {
        return this.isProcessingSubj.asObservable();
    }

    public ngOnDestroy() {
        this.isProcessingSubj.unsubscribe();
    }

    private async executeAsync(): Promise<void> {
        this.isProcessingSubj.next(true);
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
        this.isProcessingSubj.next(false);
    }

    private sendTx(transaction: UnsignedTransaction): Promise<void | TransactionReceipt> {
        return this.getNonce(transaction.user.address)
            .then(nonceValue => {
                this.nonceValue = nonceValue;
                this.log.d("Nonce value", this.nonceValue);
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

    private getNonce(userAddress: string): Promise<number> {
        return this.web3 ? this.web3.eth.getTransactionCount(userAddress, "pending") :
        this.getTransactionCount(userAddress);
    }

    private getTransactionCount(userAddress: string): Promise<number> {
        return Web3Service.getWeb3().then(web3 => {
            this.web3 = web3;
            return this.web3.eth.getTransactionCount(userAddress, "pending");
        });
    }
}
