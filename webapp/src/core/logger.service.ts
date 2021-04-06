
export interface ILogger {
    d: ILogCall; //log
    w: ILogCall; //warn
    e: ILogCall; //error
}

export interface ILogCall {
    (...args: any[]): void;
}

//NOTE: not using @Injectable as this class is only instantiated by a custom factory, not Angular
export class LoggerService {

    public static readonly logFnsThis = [console, console, console];
    //tslint:disable-next-line:no-console
    private logFns = [console.log, console.warn ? console.warn : console.log, console.error ? console.error : console.log];
    private msgPrefixes = [["[", "]"], ["[", "] WARN: "], ["[", "] ERROR: "]];
    private logDebug = false;
    private logWarnAndErrs = false;

    constructor(logDebug = false, logWarnAndErrs = false) {
        this.logDebug = logDebug;
        this.logWarnAndErrs = logWarnAndErrs;
    }

    public get(prefix: string) {
        let ret: ILogger = {
            d: function (...args: any[]) {/*empty block*/ },
            w: function (...args: any[]) {/*empty block*/ },
            e: function (...args: any[]) {/*empty block*/ }
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
                d: this.logWarnAndErrs ? function (...args: any[]) {/*empty block*/ } :  loggerFns[0],
                w: loggerFns[1],
                e: loggerFns[2]
            };
            ret.d("Logger created");
        }
        return ret;
    }
}
