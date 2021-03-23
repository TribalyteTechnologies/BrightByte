import { BackendConfig } from "../backend.config";
import Web3 from "web3";
import { from, Observable, throwError, timer } from "rxjs";
import { map, retryWhen, tap, delayWhen } from "rxjs/operators";

export class Web3Service {

    private static readonly TIME_OUT_MILIS = 3000;
    private static readonly RETRY_LIMIT = 20;

    public static getWeb3(): Observable<Web3> {
        let attempt = 1;
        const web3 = new Web3(new Web3.providers.WebsocketProvider(BackendConfig.NODE_CONFIG_URL));
        return from(web3.eth.net.isListening()).pipe(
            retryWhen(errors => errors.pipe(
                delayWhen(e => timer(this.TIME_OUT_MILIS * attempt)),
                tap(e => {
                    if (++attempt >= this.RETRY_LIMIT) {
                        throw e;
                    }
                })
            )),
            map(isConnected => {
                if (!isConnected) {
                    throw throwError("Connection not open");
                }
                return web3;
            })
        );
    }
}
