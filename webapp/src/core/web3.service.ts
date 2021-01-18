import { default as Web3 } from "web3";
import { AppConfig } from "../app.config";

export class Web3Service {

    private static readonly TIME_OUT_MILIS = 2000;

    public static getWeb3(): Promise<Web3> {
        const web3 = new Web3(AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX].urlNode);
        return Promise.race([
            this.testWeb3(web3),
            this.auxFunction()
        ]);
    }

    private static testWeb3(web3: Web3): Promise<Web3> {
        return web3.eth.personal.getAccounts().then(accounts => {
            return web3;
        });
    }

    private static auxFunction(): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(() => reject("Unreachable Http Provider for web3"), this.TIME_OUT_MILIS);
        });
    }
}
