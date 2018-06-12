import { Injectable } from "@angular/core";
import { default as Web3 } from 'web3';
import { AppConfig } from "../app.config"

@Injectable()
export class Web3Service {

    private web3: Web3;
    
    constructor(){
        this.web3 = new Web3(new Web3.providers.HttpProvider(AppConfig.URL_NODE));
        Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send; 
    }
    
    public getWeb3(): Web3 {
        return this.web3;
    }

}

