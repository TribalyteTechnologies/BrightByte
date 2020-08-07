import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { ContractManagerService } from "./contract-manager.service";
import { UnsignedTransaction } from "../models/unsigned-transaction-info.model";

@Injectable()
export class TransactionQueueService implements OnDestroy{

    public promiseQueue: Array<Promise<any>>;
    
    private readonly QUEUE_CHECK_INTERVAL_MILIS = 60000;

    private isProcessing = new BehaviorSubject<boolean>(false);
    private processInterval;

    constructor(private contractManager: ContractManagerService) {
        this.promiseQueue = new Array<Promise<any>>();
        this.processInterval = setInterval(
            () => {
                this.processQueue();
            }, 
            this.QUEUE_CHECK_INTERVAL_MILIS);
    }

    public enqueue(promise: Promise<any>): Promise<any> {
        this.promiseQueue.push(promise);
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

    private onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }

    private processQueue() {
        let currentPromise: Promise<any>;
        if (this.promiseQueue.length > 0 && !(this.isProcessing.getValue())) {
            let donePromise = new Array<Promise<any>>();
            this.isProcessing.next(true);
            this.promiseQueue.reduce(
                (prevVal, item) => {
                    return prevVal.then(() => {
                        this.promiseQueue = this.promiseQueue.filter(this.onlyUnique);
                        currentPromise = item;
                        return item;
                    }).then((unsignedTx: UnsignedTransaction) => {
                        return this.contractManager.sendTx(unsignedTx.byteCode, unsignedTx.contractAddress);
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
                if (this.promiseQueue.length > 0) {
                    this.removePromiseFromQueue(currentPromise);
                    this.processQueue();
                }
            });
        } 
    }

    private removePromiseFromQueue(item: Promise<any>) {
        if(this.promiseQueue.indexOf(item) >= 0){
            this.promiseQueue.splice(this.promiseQueue.indexOf(item), 1);
        }
    }
}
