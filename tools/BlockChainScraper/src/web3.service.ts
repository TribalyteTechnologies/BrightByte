import Web3 from "web3";
import { BlockchainScrapperConfig } from "./blockchain-scrapper.config"

export class Web3Service {
    public constructor() { }

    public openConnection(): Web3 {
        console.log("Prepared to open a connection");
        let web3 = new Web3(BlockchainScrapperConfig.HTTP_OR_WS_NODE_URL);
        return web3;
    }
}
