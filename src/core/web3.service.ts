import { Injectable } from "@angular/core";
import { default as Web3 } from 'web3';
import { AppConfig } from "../app.config"

@Injectable()
export class Web3Service {

    public web3: any;
    
    constructor(){
        this.web3 = new Web3(new Web3.providers.HttpProvider(AppConfig.URL_NODE));//http://52.209.188.78:22000"));
        Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send; 
    }
    
    public getWeb3(){
        return this.web3;
    }

}

