import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { default as contract }  from "truffle-contract";
import Tx from "ethereumjs-tx";
import { HttpClient } from "@angular/common/http";
//import { stringify } from "@angular/compiler/src/util";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { AppConfig } from "../../app.config"
import { default as Web3 } from "web3";

@Component({
    selector: "page-newuser",
    templateUrl: "newuser.html"
})

export class NewuserPage {
    public abi: any;
    public abijson;
    public contract: any;
    public bright: any;
    public account: any;
    public web3: Web3;
    public Priv: string;
    public privateKey: Buffer;
    public rawTx: any;
    public sent: any;
    public nonce: string;
    private log: ILogger;
    public file: Blob;

    constructor(
        public navCtrl: NavController, 
        public http: HttpClient, 
        private loggerSrv: LoggerService, 
        private web3Service: Web3Service
    ) {
        this.log = this.loggerSrv.get("NewUserPage");
        this.web3 = this.web3Service.getWeb3();
        this.http.get("../assets/build/Bright.json").subscribe(data =>  {
            this.abijson = data;
            this.abi= data["abi"];
            this.bright = contract(this.abijson)//TruffleContract function
        },(err) => this.log.e(err), () => {
            //If you want do after the promise. Code here
            this.log.d("TruffleContract function: ",this.bright);
        });
      
    }

    public buttonSetprofile(Name: string, Mail: string){
          
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
            let data = this.contract.methods.setProfile(Name, Mail).encodeABI();
            this.log.d("Introduced name: ",Name);
            this.log.d("Introduced Mail: ",Mail);
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
                }else{
                    this.log.e(err);
                }
            });
        }).catch(e => {
            this.log.e("Error getting nonce value: ",e);
        });
    };  

    public getData(){
        this.contract.methods.getUser(this.account.address).call().then(console.log);       
    }

    public createUser(Name: string, Mail: string, Pass: string){
        this.account = this.web3.eth.accounts.create(this.web3.utils.randomHex(32));
        this.file = this.generateText(this.account,Name, Mail, Pass);
        this.saveFileLink(this.file, "Identity.json");
        document.getElementById("downButton").style.display = "block"; //TODO: Change this and use property [hidden] of angular
    }

    public saveFileLink(contentinBlob:Blob, filename: string) {

        let reader = new FileReader();
        reader.onload = (event: any) => {// TODO: Should be FileReaderProgressEvent but it can not find it
            let save = document.createElement("a");
            let target = event.target;
            save.href = target.result; 
            save.target = "_blank";
            save.download = filename || "file.dat";
            let clicEvent = new MouseEvent("click", {
                "view": window,
                "bubbles": true,
                "cancelable": true
            });
            save.dispatchEvent(clicEvent);
            (window.URL).revokeObjectURL(save.href);// || window.webkitURL
        };
        reader.readAsDataURL(contentinBlob);
    };

    private generateText(data, Name: string,Mail: string, Pass: string) {
        let Encrypted = this.web3.eth.accounts.encrypt(data.privateKey, Pass);
        let text=[];
        text.push('{"Account":{');
        text.push('"User":');
        text.push('"'+Name+'",');
        text.push('"Mail":');
        text.push('"'+Mail+'"} , "Keys":{');
        text.push('"address":'+JSON.stringify(data.address)+',"privateKey":'+JSON.stringify(Encrypted)+'}}');
        //The blob constructor needs an array as first parameter, so it is not neccessary use toString.
        //The second parameter is the MIME type of the file.
        return new Blob(text, {
            type: "text/plain"
        });
    };

}


