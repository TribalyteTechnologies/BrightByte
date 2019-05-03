import { Injectable } from "@angular/core";
import { default as Web3 } from "web3";
import { AppConfig } from "../app.config";
import { ILogger, LoggerService } from "../core/logger.service";

@Injectable()
export class Web3Service {

    private web3: Web3;
    private web3Source: Web3;
    private log: ILogger;

    constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("Web3Service");
        this.web3 = new Web3(new Web3.providers.HttpProvider(AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX].urlNode));
        this.web3Source = new Web3(new Web3.providers.HttpProvider(AppConfig.NETWORK_CONFIG_SOURCE[AppConfig.CURRENT_NODE_INDEX].urlNode));
        Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;

    }

    public getWeb3(): Web3 {
        return this.web3;
    }

    public getWeb3Source(): Web3 {
        return this.web3Source;
    }
}
