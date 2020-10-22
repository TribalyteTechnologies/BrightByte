import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import Web3 from "web3";

@Injectable()
export class Web3Service {

    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("Web3Service");
    }

    public openConnection(): Web3 {
        this.log.d("Opening a new Wesocket connection via Web3");
        return new Web3(new Web3.providers.WebsocketProvider(BackendConfig.NODE_CONFIG_URL));;
    }
}
