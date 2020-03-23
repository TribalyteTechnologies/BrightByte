import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import Web3 from "web3";

@Injectable()
export class Web3Service {

    private web3: Web3;
    private httpWeb3: Web3;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("Web3Service");
        this.web3 = this.openConnection();
    }

    public getWeb3(): Web3 {
        return this.web3;
    }

    public openConnection(): Web3 {
        this.log.d("Opening a new Wesocket connection via Web3");
        let auxWeb3 = new Web3(new Web3.providers.WebsocketProvider(BackendConfig.NODE_CONFIG_URL));
        auxWeb3.eth.net.isListening()
            .then((res) => {
                this.log.d("Open connection ");
            }).catch(e => {
                this.log.w("Not able to open a connection " + e);
            });
        return auxWeb3;
    }
}
