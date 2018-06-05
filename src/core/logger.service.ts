import { Injectable } from "@angular/core";

export interface ILogService {
    get(name: string): ILogger;
}

export interface ILogger {
    d: ILogCall; //log
    w: ILogCall; //warn
    e: ILogCall; //error
}

export interface ILogCall {
    (...args: any[]): void;
}

@Injectable()
export class LoggerService implements ILogService {

    public static readonly logFnsThis = [console, console, console];
    private logFns = [console.log, console.warn, console.error];
    private msgPrefixes = [["[", "]"], ["[", "] WARN: "], ["[", "] ERROR: "]];
    private logDebug = false;

    constructor(logDebug = false){
        this.logDebug  = logDebug;
    }
    
    public get(prefix: string) {
        let ret: ILogger = {
            d: function (...args: any[]) {/*empty block*/},
            w: function (...args: any[]) {/*empty block*/},
            e: function (...args: any[]) {/*empty block*/}
        };
        if (this.logDebug) {
            let loggerFns = this.logFns.map((logTempFn, i) => {
                let logTmp = logTempFn.bind(
                    LoggerService.logFnsThis[i],
                    this.msgPrefixes[i][0] + prefix + this.msgPrefixes[i][1]
                );
                return function (...args: any[]) {
                    logTmp.apply(LoggerService.logFnsThis[i], arguments);
                };
            });
            ret = {
                d: loggerFns[0],
                w: loggerFns[1],
                e: loggerFns[2]
            };
            ret.d("[" + prefix + "] Logger created");
        }
        return ret;
    }
}

