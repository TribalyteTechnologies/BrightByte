import Web3 from "web3";
import { SeasonAnalyticsConfig } from "./season-analytics.config"

export class Web3Service {
    public constructor() { }

    public openWebSocketConnection(): Web3 {
        console.log("Prepared to open a connection via Websocket");
        let web3 = new Web3(new Web3.providers.WebsocketProvider(SeasonAnalyticsConfig.WS_URL_NODE));
        return web3;
    }
}
