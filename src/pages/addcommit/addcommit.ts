import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import {ILogger, LoggerService} from "../../core/logger.service";
import {Web3Service} from "../../core/web3.service";
import {LoginService} from "../../core/login.service";
import { AppConfig } from "../../app.config"
import Tx from "ethereumjs-tx";
import {HttpClient} from "@angular/common/http";
import { default as contract }  from "truffle-contract";
import { default as Web3 } from "web3";

@Component({
	selector: "popover-addcommit",
	templateUrl: "addcommit.html"
})
export class AddCommitPopover {
	public web3: Web3;
	public account: any;
	private log: ILogger;
    public bright:any;
    public abi:any;
    public contract:any;
    public nonce:string;
    public abijson:any;
    public usersMail = ["","","",""];
    constructor(
        public navCtrl: NavController,
        public http: HttpClient, 
        private loggerSrv: LoggerService, 
        private web3Service: Web3Service, 
        private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("AddCommitPage");
        this.account = this.loginService.getAccount();
        this.account = this.loginService.getAccount();
		this.log.d("Imported account successfully",this.account);
		this.http.get("../assets/build/Bright.json").subscribe(data =>  {
            this.abijson = data;
            this.abi= data["abi"];
            this.bright = contract(this.abijson); //TruffleContract function
        },(err) => this.log.e(err), () => {
            //If you want do after the promise. Code here
            this.log.d("TruffleContract function: ",this.bright);
        });

 	}
     public addCommit(url: string, project: string){//, user1: string, user2:string, user3: string, user4: string){
        //let users = [user1,user2,user3,user4];
        let account:string = this.account.address;
        let contractAddress = this.bright.networks[AppConfig.NET_ID].address;//In alastria is 82584648528 instead of 4447 thats it is in local
        this.log.d("Contract Address: ",contractAddress);
        this.log.d("Public Address: ",account);
        this.contract = new this.web3.eth.Contract(this.abi,contractAddress, {
            from: this.account.address, 
            gas:AppConfig.GAS_LIMIT, 
            gasPrice:AppConfig.GASPRICE, 
            data: this.bright.deployedBytecode
        });
        this.log.d("Contract artifact",this.contract);
          
        this.web3.eth.getTransactionCount(account)
        .then(result => {
            this.nonce= "0x" + (result).toString(16);
        }).then(() => {
            this.log.d("Value NONCE",this.nonce);
            this.contract = new this.web3.eth.Contract(this.abi,contractAddress, {
                from: this.account.address, 
                gas:AppConfig.GAS_LIMIT, 
                gasPrice:AppConfig.GASPRICE, 
                data: this.bright.deployedBytecode
            });
          
           
            let id = url; //TODO get the id from url
            let data = this.contract.methods.setNewCommit(id,url,project,this.usersMail[0],this.usersMail[1],this.usersMail[2],this.usersMail[3]).encodeABI();
            this.log.d("Introduced url: ",url);
            this.log.d("Introduced project: ",project);
            this.log.d("Introduced user1: ",this.usersMail[0]);
            this.log.d("Introduced user2: ",this.usersMail[1]);
            this.log.d("Introduced user3: ",this.usersMail[2]);
            this.log.d("Introduced user4: ",this.usersMail[3]);

            this.log.d("DATA: ",data);
                    
            let rawtx = {
                nonce: this.nonce,
                gasPrice: this.web3.utils.toHex(AppConfig.GASPRICE),
                gasLimit: this.web3.utils.toHex(AppConfig.GAS_LIMIT),
                to: contractAddress,
                data: data
            };
            const tx = new Tx(rawtx);
            let priv = this.account.privateKey.substring(2);
            let privateKey = new Buffer(priv, "hex");
            let txfirm = tx.sign(privateKey);

            let raw = "0x" + tx.serialize().toString("hex");
            this.log.d("Rawtx: ",rawtx);
            this.log.d("Priv si 0x: ",priv);
            this.log.d("privatekey: ",privateKey);
            this.log.d("Raw: ",raw);
            this.log.d("tx unsign: ",tx);
            this.web3.eth.sendSignedTransaction(raw, (err, transactionHash) =>{
                if(!err){
                  this.log.d("Hash transaction",transactionHash);
                }else{this.log.e(err);}
            });
        }).catch(e => {
          this.log.e("Error getting nonce value: ",e);
        });
     }
     
}
