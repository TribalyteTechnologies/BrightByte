import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import Web3 from "web3";
import { from, Observable } from "rxjs";
import { map, catchError } from "rxjs/operators";

@Injectable()
export class Web3Service {

    private web3: Web3;
    private httpWeb3: Web3;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("Web3Service");
        this.openConnection().subscribe(res => this.web3 = res);
    }

    public openConnection(): Observable<Web3> {
        this.log.d("Opening a new Wesocket connection via Web3");
        let auxWeb3 = new Web3(new Web3.providers.WebsocketProvider(BackendConfig.NODE_CONFIG_URL));
        return from(auxWeb3.eth.net.isListening())
        .pipe(
            map(res => {
                this.log.d("Open connection ", res);
                this.web3 = auxWeb3;
                return auxWeb3;
            }),
            catchError(error => {
                this.log.e("Not able to open a connection: ", error);
                return error;
            })
        );
    }
}
