import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { AppConfig } from "../../app.config";
import { default as Web3 } from "web3";
import Tx from "ethereumjs-tx";
import { default as contract }  from "truffle-contract";
import { HttpClient } from "@angular/common/http";
import { TabsPage } from "../../pages/tabs/tabs";

@Component({
	selector: "page-setprofile",
	templateUrl: "setprofile.html"
})
export class SetProfilePage {
	public web3: Web3;
	public account: any;
	public abi: any;
    public abijson: any;
	public bright: any;
	public contract: any;
	public nonce: string;
	private log: ILogger;

	constructor(
		public navCtrl: NavController, 
		private loggerSrv: LoggerService, 
		private web3Service: Web3Service, 
		public http: HttpClient, 
		private loginService: LoginService
	){
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("SetProfilePage");
		this.account = this.loginService.getAccount();
		this.log.d("Unlocked account: ",this.account);
		this.http.get("../assets/build/Bright.json").subscribe(data =>  {
            this.abijson = data;
            this.abi= data["abi"];
            this.bright = contract(this.abijson); //TruffleContract function
        },(err) => this.log.e(err), () => {
            //If you want do after the promise. Code here
            this.log.d("TruffleContract function: ",this.bright);
        });
	}
	  
	public buttonSetprofile(name: string, mail: string){
          
        let account:string = this.account.address;
        let contractAddress = this.bright.networks[AppConfig.NET_ID].address;
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
            let data = this.contract.methods.setProfile(name, mail).encodeABI();
            this.log.d("Introduced name: ",name);
            this.log.d("Introduced Mail: ",mail);
            this.log.d("DATA: ",data);
                    
            let rawtx = {
                nonce: this.nonce,
                gasPrice: this.web3.utils.toHex(AppConfig.GASPRICE),// I could use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                gasLimit: this.web3.utils.toHex(AppConfig.GAS_LIMIT),
                to: contractAddress,
                data: data
            };
            const tx = new Tx(rawtx);
            let priv = this.account.privateKey.substring(2);
            let privateKey = new Buffer(priv, "hex");
            tx.sign(privateKey);

            let raw = "0x" + tx.serialize().toString("hex");
            this.log.d("Rawtx: ",rawtx);
            this.log.d("Priv si 0x: ",priv);
            this.log.d("privatekey: ",privateKey);
            this.log.d("Raw: ",raw);
            this.log.d("tx unsign: ",tx);
            this.web3.eth.sendSignedTransaction(raw, (err, transactionHash) =>{
                if(!err){
					this.log.d("Hash transaction",transactionHash);
					this.navCtrl.push(TabsPage);
                }else{
                    this.log.e(err);
                }
			});
			
        }).catch(e => {
            this.log.e("Error getting nonce value: ",e);
        });
    };  
}
