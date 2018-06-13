import { Injectable } from "@angular/core";
import { default as Web3 } from 'web3';
import {Web3Service} from "../core/web3.service";
import {LoginService} from "../core/login.service";
import {ILogger, LoggerService} from "../core/logger.service";

import {AppConfig} from "../app.config";
import { HttpClient } from "@angular/common/http";
import { default as contract }  from "truffle-contract";
@Injectable()
export class ContractManager {

    private log: ILogger;
    private web3: Web3;
    public contract: any;
    public abi: any;
    public abijson: any;
    public bright: any;
    private createAccount: any;

    constructor(
        public http: HttpClient, 
        private web3Service: Web3Service,
        private loggerSrv: LoggerService,
        private loginService: LoginService
    ){
        this.web3 = this.web3Service.getWeb3();
        this.log = this.loggerSrv.get("ContractManagerService");
        this.http.get("../assets/build/Bright.json").subscribe(data =>  {
            this.abijson = data;
            this.abi= data["abi"];
            this.bright = contract(this.abijson); //TruffleContract function
        },(err) => this.log.e(err), () => {
            //If you want do after the promise. Code here
            this.log.d("TruffleContract function: ",this.bright);
        });
    }
    public createUser(pass: string): Promise<any>{
       return new Promise((resolve,reject)=>{
            resolve (this.web3.eth.accounts.create(this.web3.utils.randomHex(32)));
             
        });
    }
    

}

