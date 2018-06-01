import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { default as Web3 } from 'web3';
import { default as contract }  from 'truffle-contract';
import Tx from 'ethereumjs-tx';
import {HttpClient} from '@angular/common/http';
import { stringify } from '@angular/compiler/src/util';
//var Bright = contract(Bright_artifacts);
@Component({
  selector: 'page-newuser',
  templateUrl: 'newuser.html'
})
export class NewuserPage {
  public abi: any;
  public abijson;
  Bright: any;
  account: any;
  web3: Web3;
  Priv: any;
  privateKey: any;
  rawTx: any;
  sent: any;
  i: any;
  
  constructor(public navCtrl: NavController, public http: HttpClient) { //, public web3: Web3
  
    
      this.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));//http://52.209.188.78:22000"));
      Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
      //console.log("CurrentProvider: ",this.web3.currentProvider);
      
    //this.account = this.web3.eth.accounts.create('Pass');
    this.http.get('../assets/build/Bright.json').subscribe(data =>  {
      this.abijson = data;
      this.abi= data['abi'];
      //console.log("ABIJSON: ",this.abijson);
      this.Bright = contract(this.abijson)//TruffleContract function
      },(err) => console.error(err), () => {
        //If you want do after the promise. Code here
     });
    /*
    this.Priv = this.account.privateKey.substring(2);
    this.privateKey = new Buffer(this.Priv, 'hex');
    this.rawTx = {
      nonce: '0x00',
      gasPrice: '0x00',//'0x09184e72a000',
      gasLimit: '0x1E8480',//'0x2710',
      to: '0x6EB1E76B3B4002EaEfB07619DA0447d8954D2f99',
      value: '0x00'//,
      //data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057'
      }
    const tx = new Tx(this.rawTx);

    tx.sign(this.privateKey);
    
    const serializedTx = `0x${tx.serialize().toString('hex')}`;
    
    this.sent = this.web3.eth.sendSignedTransaction(serializedTx);
    console.log("Transaccion enviada: ",this.sent);
    this.i =1;
    console.log(this.web3.version);*/
    this.i =0;
  }

public ButtonClicked(Name){
  //alert("DONT CLICK ME");
  console.log(Name);
  let a = '0x' + (this.i).toString(16);
  this.Priv = this.account.privateKey.substring(2);
    this.privateKey = new Buffer(this.Priv, 'hex');
    this.rawTx = {
      nonce: a,
      gasPrice: '0x00',
      gasLimit: '0x1E8480',
      to: '0x6EB1E76B3B4002EaEfB07619DA0447d8954D2f99',
      value: '0x00'
      //data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057'
    }
    const tx = new Tx(this.rawTx);

    tx.sign(this.privateKey);
    
    const serializedTx = `0x${tx.serialize().toString('hex')}`;
    
    this.sent = this.web3.eth.sendSignedTransaction(serializedTx);
    this.i++
    console.log(this.sent);
}
public ButtonSetprofile(Name){
        let contractAddress = this.Bright.networks[4447].address;
        let publicAddress: string = this.account.address;
        console.log(this.account.address);
        let myContract = new this.web3.eth.Contract(this.abi, contractAddress, {from: "0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e", gas:200000, gasPrice:100, data: this.Bright.deployedBytecode}); // gasPrice: 0 in alastria
        //console.log(myContract.options.jsonInterface);
        myContract.methods.setProfile("aaaa", "AAAAAA", "0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e").send({from: "0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e"}).on('transactionHash', function(hash){console.log("Hash de la transaccion",hash);}).on('confirmation', function(confirmationNumber, receipt){console.log("Numero de confirmacion: ",confirmationNumber);}).on('error', console.error);
        myContract.methods.getUser("0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e").call().then(console.log);       
  
  };


public createUser(Name, Mail){
  this.account = this.web3.eth.accounts.create('Pass');
  this.downloadFile(this.generateText(this.account,Name, Mail), 'Identity.json');
  console.log(this.account.address);
}

private downloadFile(contenidoEnBlob, nombreArchivo) {
  let reader = new FileReader();
  reader.onload = (event: any) =>{// TODO: Should be FileReaderProgressEvent but it can not find it
    console.log(event);
      let save = document.createElement('a');
      let target = event.target;
      //console.log(target.result);
      save.href = target.result; //Hay que pasar de este error Porque no tiene sentido. FUNCIONA
      save.target = '_blank';
      save.download = nombreArchivo || 'archivo.dat';
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

private generateText(data,Name,Mail) {
  let texto=[];
  texto.push('{ "Account": {');
  texto.push('"User": ');
  texto.push('"'+Name+'",');
  //texto.push('\n');
  texto.push('"Mail": ');
  texto.push('"'+Mail+'" } , "Keys":');
  //texto.push('\n');
  texto.push(JSON.stringify(data)+'}');
  //console.log(texto);
  //El contructor de Blob requiere un Array en el primer parámetro
  //así que no es necesario usar toString. el segundo parámetro
  //es el tipo MIME del archivo
  return new Blob(texto, {
      type: 'text/plain'
  });
};

}


