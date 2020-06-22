import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import Web3 from "web3";
import { from, Observable } from "rxjs";
import { map, catchError } from "rxjs/operators";

@Injectable()
export class Web3Service {

    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("Web3Service");
    }

    public openConnection(): Observable<Web3> {
        this.log.d("Opening a new Wesocket connection via Web3");
        let auxWeb3 = new Web3(new Web3.providers.WebsocketProvider(BackendConfig.NODE_CONFIG_URL));
        return from(auxWeb3.eth.net.isListening())
        .pipe(
            map(res => {
                this.log.d("Open connection ", res);
                return auxWeb3;
            }),
            catchError(error => {
                this.log.e("Not able to open a connection: ", error);
                throw error;
            })
        );
    }
}
