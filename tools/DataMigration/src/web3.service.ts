import Web3 from "web3";
import { MigrationConfig } from "./migration.config"

export class Web3Service {
    public constructor() { }

    public openHttpConnection(): Web3 {
        console.log("Prepared to open a connection via Http");
        let web3 = new Web3(new Web3.providers.HttpProvider(MigrationConfig.HTTP_URL_NODE));
        return web3;
    }

    public openWebSocketConnection(): Web3 {
        console.log("Prepared to open a connection via Websocket");
        let web3 = new Web3(new Web3.providers.WebsocketProvider(MigrationConfig.WS_URL_NODE));
        return web3;
    }
}
