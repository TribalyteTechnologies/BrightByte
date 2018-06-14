import { Injectable } from "@angular/core";
import { default as Web3 } from 'web3';
import { AppConfig } from "../app.config"
import { ILogger, LoggerService } from "../core/logger.service";

@Injectable()
export class Web3Service {

    private web3: Web3;
    private log: ILogger;

    constructor(
        private loggerSrv: LoggerService,
    ){
        this.log = this.loggerSrv.get("Web3Service");
        this.web3 = new Web3(new Web3.providers.HttpProvider(AppConfig.URL_NODE));
        Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
       
    }
    
    public getWeb3(): Web3 {
        return this.web3;
    }

}

