import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { default as Web3 } from 'web3';
import { default as contract }  from 'truffle-contract';
import Tx from 'ethereumjs-tx';
import {HttpClient} from '@angular/common/http';
import { stringify } from '@angular/compiler/src/util';

@Component({
  selector: 'page-newuser',
  templateUrl: 'newuser.html'
})

export class NewuserPage {
  public abi: any;
  public abijson;
  contract:any;
  Bright: any;
  account: any;
  web3: Web3;
  Priv: any;
  privateKey: any;
  rawTx: any;
  sent: any;
  nonce:any;

  constructor(public navCtrl: NavController, public http: HttpClient) {
  
      this.web3 = new Web3(new Web3.providers.HttpProvider("http://52.209.188.78:22000"));
      Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
      this.http.get('../assets/build/Bright.json').subscribe(data =>  {
      this.abijson = data;
      this.abi= data['abi'];
      this.Bright = contract(this.abijson)//TruffleContract function
      },(err) => console.error(err), () => {
        //If you want do after the promise. Code here
        console.log("TruffleContract function: ",this.Bright);
     });
    
  }

public ButtonSetprofile(Name, Mail){
       
  let account:string = this.account.address;
  let contractAddress = this.Bright.networks[82584648528].address;//In alastria is 82584648528 instead of 4447 thats it is in local
        console.log("Direccion del contrato: ",contractAddress);
        console.log("Direccion publica: ",account);
        let self=this;
    this.contract = new this.web3.eth.Contract(this.abi,contractAddress, {from: this.account.address, gas:200000, gasPrice:0, data: this.Bright.deployedBytecode});
    console.log("artefacto del contrato",this.contract);
    
       let cuenta = this.web3.eth.getTransactionCount(account)
        .then(function(result){
          self.nonce= '0x' + (result).toString(16);
        }).then(function(){
          console.log("VALOR DEL NONCE",self.nonce);
          self.contract = new self.web3.eth.Contract(self.abi,contractAddress, {from: self.account.address, gas:2000000, gasPrice:0, data: self.Bright.deployedBytecode});
          let data = self.contract.methods.setProfile(Name, Mail, self.account.address).encodeABI();
          console.log("DATA: ",data);
          let rawtx = new Tx({
            nonce: self.nonce,
            gasPrice: self.web3.utils.toHex(0),//Alastria needs value 0 and localhost 100. I can use web3.eth.getGasPrice() to determine which is the gasPrise needed.
            gasLimit: self.web3.utils.toHex(200000),
            to: contractAddress,
            //value: 0x00,
            data: data
          });
          const tx = new Tx(rawtx);
          let Priv = self.account.privateKey.substring(2);
          let privateKey = new Buffer(Priv, 'hex');
          let txfirm = tx.sign(privateKey);

          let raw = '0x' + tx.serialize().toString('hex');
          console.log("Rawtx: ",rawtx);
          console.log("Priv si 0x: ",Priv);
          console.log("privatekey: ",privateKey);
          console.log("Lo que realmente envio en bruto Raw: ",raw);
          console.log("tx sin firmar: ",tx);
          console.log("tx firmado: ",txfirm);
          self.web3.eth.sendSignedTransaction(raw, function (err, transactionHash) {
            if(!err){
            console.log("Hash de la transaccion",transactionHash);
            }else{console.warn(err);}
          });
        }).catch(function(e) {
          console.error("Error getting nonce value: ",e);
      });
    //this.i++;        
 };
public getData(){
  //let myContract = new this.web3.eth.Contract(this.abi, this.Bright.networks[4447].address, {from: this.account.address, gas:200000, gasPrice:100, data: this.Bright.deployedBytecode}); // gasPrice: 0 in alastria
  this.contract.methods.getUser(this.account.address).call().then(console.log);       

}

public createUser(Name, Mail, Pass){

      this.account = this.web3.eth.accounts.create('Pass');
      this.downloadFile(this.generateText(this.account,Name, Mail, Pass), 'Identity.json');
}

private downloadFile(contenidoEnBlob, filename) {

      let reader = new FileReader();
      reader.onload = (event: any) =>{// TODO: Should be FileReaderProgressEvent but it can not find it

          let save = document.createElement('a');
          let target = event.target;
          save.href = target.result; 
          save.target = '_blank';
          save.download = filename || 'file.dat';
          let clicEvent = new MouseEvent('click', {
              'view': window,
                  'bubbles': true,
                  'cancelable': true
          });
          save.dispatchEvent(clicEvent);
          (window.URL).revokeObjectURL(save.href);// || window.webkitURL
      };
      reader.readAsDataURL(contenidoEnBlob);
};

private generateText(data,Name,Mail, Pass) {
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
          type: 'text/plain'
      });
};

}


