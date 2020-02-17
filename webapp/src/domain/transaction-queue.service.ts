import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable()
export class TransactionQueueService implements OnDestroy{
    public promiseQueue: Array<Promise<any>>;
    public isProcessing = new BehaviorSubject<boolean>(false);
    private processInterval;
    constructor() {
        this.promiseQueue = new Array<Promise<any>>();
        this.processInterval = setInterval(
            () => {
                this.processQueue();
            }, 
            60000);
    }

    public enqueue(promise: Promise<any>): Promise<any> {
        this.promiseQueue.push(promise);
        this.processQueue();
        return Promise.resolve();
    }

    public getStatus(): Observable<boolean> {
         return this.isProcessing.asObservable();
    }

    public ngOnDestroy() {
        this.processInterval.clearInterval();
        this.isProcessing.unsubscribe();
    }

    private processQueue() {
        if (this.promiseQueue.length > 0 && !(this.isProcessing.getValue())) {
            let donePromise = new Array<Promise<any>>();
            this.isProcessing.next(true);
            this.promiseQueue.reduce(
                (prevVal, item) => {
                    return prevVal.then(() => {
                        return donePromise.push(item);
                    });
                },
                Promise.resolve()
            ).then(() => {
                for (let item of donePromise) {
                    if(this.promiseQueue.indexOf(item) >= 0){
                        this.promiseQueue.splice(this.promiseQueue.indexOf(item), 1);
                    }
                }
            }).then(() => {
                setTimeout(
                    () => {
                        this.isProcessing.next(false);
                    },
                    1000);
            });
        } 
    }
}
