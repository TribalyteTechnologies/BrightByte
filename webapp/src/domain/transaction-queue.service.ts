import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { UnsignedTransaction } from "../models/unsigned-transaction-info.model";
import { TransactionReceipt } from "web3-core";
import { ILogger, LoggerService } from "../core/logger.service";
import { AppConfig } from "../app.config";
import Tx from "ethereumjs-tx";
import { default as Web3 } from "web3";
import { Web3Service } from "../core/web3.service";
import { Account } from "web3-eth-accounts";

@Injectable()
export class TransactionQueueService implements OnDestroy{

    public transactionQueue: Array<UnsignedTransaction>;
    
    private readonly QUEUE_CHECK_INTERVAL_MILIS = 60000;

    private isProcessing = new BehaviorSubject<boolean>(false);
    private processInterval;
    private log: ILogger;
    private web3: Web3;

    constructor(
        private loggerSrv: LoggerService,
        private web3Service: Web3Service
    ) {
        this.log = this.loggerSrv.get("TransactionQueueService");
        this.web3 = this.web3Service.getWeb3();
        this.transactionQueue = new Array<UnsignedTransaction>();
        this.processInterval = setInterval(
            () => {
                this.processQueue();
            }, 
            this.QUEUE_CHECK_INTERVAL_MILIS);
    }

    public enqueue(promise: UnsignedTransaction): Promise<void> {
        this.transactionQueue.push(promise);
        this.processQueue();
        return Promise.resolve();
    }

    public getProcessingStatus(): Observable<boolean> {
         return this.isProcessing.asObservable();
    }

    public ngOnDestroy() {
        this.processInterval.clearInterval();
        this.isProcessing.unsubscribe();
    }

    public sendTx(bytecodeData, contractAddress, user: Account): Promise<TransactionReceipt> {
        return this.web3.eth.getTransactionCount(user.address, "pending")
        .then(nonceValue => {
            let nonce = "0x" + (nonceValue).toString(16);
            this.log.d("Value NONCE", nonce);
            let rawtx = {
                nonce: nonce,
                gasPrice: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX].gasPrice),
                gasLimit: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX].gasLimit),
                to: contractAddress,
                data: bytecodeData
            };
            const tx = new Tx(rawtx);
            let priv = user.privateKey.substring(2);
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

    private onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }

    private processQueue() {
        let currentTransaction: UnsignedTransaction;
        if (this.transactionQueue.length > 0 && !(this.isProcessing.getValue())) {
            let donePromise = new Array<UnsignedTransaction>();
            this.isProcessing.next(true);
            this.transactionQueue.reduce(
                (prevVal: any, item: UnsignedTransaction) => {
                    return prevVal.then(() => {
                        this.transactionQueue = this.transactionQueue.filter(this.onlyUnique);
                        currentTransaction = item;
                        return this.sendTx(currentTransaction.byteCode, currentTransaction.contractAddress, currentTransaction.user);
                    }).then(() => {
                        return donePromise.push(item);
                    });
                },
                Promise.resolve()
            ).then(() => {
                for (let item of donePromise) {
                    this.removePromiseFromQueue(item);
                }
            }).then(() => {
                this.isProcessing.next(false);
            }).catch(() => {
                this.isProcessing.next(false);
                if (this.transactionQueue.length > 0) {
                    this.removePromiseFromQueue(currentTransaction);
                    this.processQueue();
                }
            });
        } 
    }

    private removePromiseFromQueue(transaction: UnsignedTransaction) {
        let transactionIndex = this.transactionQueue.indexOf(transaction);
        if(transactionIndex >= 0){
            this.transactionQueue.splice(transactionIndex, 1);
        }
    }
}
