import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {ILogger, LoggerService} from "../../core/logger.service";
import {Web3Service} from "../../core/web3.service";
import {LoginService} from "../../core/login.service";
import { AppConfig } from "../../app.config"
import Tx from 'ethereumjs-tx';
import {HttpClient} from '@angular/common/http';
import { default as contract }  from 'truffle-contract';

@Component({
	selector: 'page-addcommit',
	templateUrl: 'addcommit.html'
})
export class AddCommitPage {
	web3: any;
	account: any;
	private log: ILogger;
    Bright:any;
    abi:any;
    contract:any;
    nonce:any;
    abijson:any;

	constructor(public navCtrl: NavController, public http: HttpClient, private loggerSrv: LoggerService, private web3Service: Web3Service, private loginService: LoginService
	) {
		this.web3 = this.web3Service.getWeb3();
		this.log = this.loggerSrv.get("AddCommitPage");
        this.account = this.loginService.getAccount();
        this.account = this.loginService.getAccount();
		this.log.d("Cuenta importada correctamente en commits",this.account);
		this.http.get('../assets/build/Bright.json').subscribe(data =>  {
            this.abijson = data;
            this.abi= data['abi'];
            this.Bright = contract(this.abijson)//TruffleContract function
        },(err) => this.log.e(err), () => {
            //If you want do after the promise. Code here
            this.log.d("TruffleContract function: ",this.Bright);
        });

 	}
     public AddCommit(url,project,user1,user2,user3,user4){
        let account:string = this.account.address;
        let contractAddress = this.Bright.networks[AppConfig.NET_ID].address;//In alastria is 82584648528 instead of 4447 thats it is in local
        this.log.d("Direccion del contrato: ",contractAddress);
        this.log.d("Direccion publica: ",account);
        this.contract = new this.web3.eth.Contract(this.abi,contractAddress, {from: this.account.address, gas:AppConfig.GAS_LIMIT, gasPrice:AppConfig.GASPRICE, data: this.Bright.deployedBytecode});
        this.log.d("artefacto del contrato",this.contract);
          
        this.web3.eth.getTransactionCount(account)
        .then(result => {
            this.nonce= '0x' + (result).toString(16);
        }).then(() => {
            this.log.d("VALOR DEL NONCE",this.nonce);
            this.contract = new this.web3.eth.Contract(this.abi,contractAddress, {from: this.account.address, gas:AppConfig.GAS_LIMIT, gasPrice:AppConfig.GASPRICE, data: this.Bright.deployedBytecode});
            if(user1 == undefined){user1="";this.log.d("user1 vacio")}
            if(user2 == undefined){user2="";this.log.d("user2 vacio")}
            if(user3 == undefined){user3="";this.log.d("user3 vacio")}
            if(user4 == undefined){user4="";this.log.d("user4 vacio")}

            let data = this.contract.methods.setNewCommit(url, project,user1,user2,user3,user4).encodeABI();
            this.log.d("Introduced url: ",url);
            this.log.d("Introduced project: ",project);
            this.log.d("Introduced user1: ",user1);
            this.log.d("Introduced user2: ",user2);
            this.log.d("Introduced user3: ",user3);
            this.log.d("Introduced user4: ",user4);

            this.log.d("DATA: ",data);
                    
            let rawtx = new Tx({
                nonce: this.nonce,
                gasPrice: this.web3.utils.toHex(AppConfig.GASPRICE),//Alastria needs value 0 and localhost 100. I can use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                gasLimit: this.web3.utils.toHex(AppConfig.GAS_LIMIT),
                to: contractAddress,
                //value: 0x00,
                data: data
            });
            const tx = new Tx(rawtx);
            let Priv = this.account.privateKey.substring(2);
            let privateKey = new Buffer(Priv, 'hex');
            let txfirm = tx.sign(privateKey);

            let raw = '0x' + tx.serialize().toString('hex');
            this.log.d("Rawtx: ",rawtx);
            this.log.d("Priv si 0x: ",Priv);
            this.log.d("privatekey: ",privateKey);
            this.log.d("Lo que realmente envio en bruto Raw: ",raw);
            this.log.d("tx sin firmar: ",tx);
            this.web3.eth.sendSignedTransaction(raw, (err, transactionHash) =>{
                if(!err){
                  this.log.d("Hash de la transaccion",transactionHash);
                }else{this.log.e(err);}
            });
        }).catch(e => {
          this.log.e("Error getting nonce value: ",e);
        });
     }
     /*close() {
        this.viewCtrl.dismiss();
      }*/
}
