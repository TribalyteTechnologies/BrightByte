import { default as Web3 } from "web3";
import { AppConfig } from "../app.config";

export class Web3Service {


    public getWeb3(): Promise<Web3> {
        const web3 = new Web3(AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX].urlNode);
        return Promise.race([
            this.testWeb3(web3),
            this.auxFunction()
        ]);
    }

    private testWeb3(web3: Web3): Promise<Web3> {
        return web3.eth.personal.getAccounts().then(accounts => {
            return web3;
        });
    }

    private auxFunction(): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(() => reject("Unreachable Http Provider for web3"), 2000);
        });
    }
}
