import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { default as Web3 } from 'web3';
import { default as contract }  from 'truffle-contract';
import Tx from 'ethereumjs-tx';
import {HttpClient} from '@angular/common/http';
//var Bright = contract(Bright_artifacts);
@Component({
  selector: 'page-review',
  templateUrl: 'review.html'
})
export class ReviewPage {
  public abi: string;
  public abijson;
  Bright: any;
  account: any;
  web3: any;
  Priv: any;
  privateKey: any;
  rawTx: any;
  sent: any;
  i: any;
  
  constructor(public navCtrl: NavController, public http: HttpClient) { //, public web3: Web3
  
    
      this.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));//http://52.209.188.78:22000"));
      Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
      console.log(this.web3.currentProvider);
      
    this.account = this.web3.eth.accounts.create('Pass');
    this.http.get('../assets/build/Bright.json').subscribe(data =>  {
      this.abijson = data;
      this.abi= data['abi'];
      this.Bright = contract(this.abijson)//.setProvider(this.webb3);
      },(err) => console.error(err), () => {
        console.log("observable complete");
        console.log(this.Bright);
        //console.log(JSON.stringify(this.abi));
        this.Bright = new this.web3.eth.Contract(this.abi);
        //this.Bright = contract(this.abijson);
        
       /* this.Bright.deployed().then(function(instance) {
          return instance.setProfile("aaaa", "AAAAAA", this.account.address, {from: this.account.address, gas:20000000});
            }).then(function(e) {
                    console.log(e);
                    document.getElementById("statusSetUser").innerHTML = ("Congratulations, your user has been created. Your name is:  " + "aaaa");
                }).catch(function(e) {
                    console.log(e);
                    document.getElementById("statusSetUser").innerHTML = ("Error creating user. See log");
                });*/
     });
    
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
    //console.log(this.sent);
    this.i =1;
    
  }

public ButtonClicked(Name){
  //alert("DONT CLICK ME");
  console.log(Name);
  let a = '0x' + (this.i).toString(16);
  this.Priv = this.account.privateKey.substring(2);
    this.privateKey = new Buffer(this.Priv, 'hex');
    this.rawTx = {
      nonce: a,
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
    this.i++
    console.log(this.sent);
}
public ButtonSetprofile(Name){
  //console.log(Name);
  //console.log(this.abijson);
  //let abi = this.web3.eth.contract(this.abi, "0xe7f4ab1295e44ab1a4c60171d97cbabb64924f7f7b941e7a10e17a5de51fbe2b");
  //let contract = abi.at(this.account.address);
  //this.Bright.setProfile.sendTransaction("Name", {from: this.account.address, gas:2000000});
  
  this.Bright.deployed().then(function(instance) {
    return instance.setProfile("aaaa", "AAAAAA", this.account.address, {from: "0x627306090abab3a6e1400e9345bc60c78a8bef57", gas:20000000});
      }).then(function(e) {
              console.log(e);
              document.getElementById("statusSetUser").innerHTML = ("Congratulations, your user has been created. Your name is:  " + "aaaa");
          }).catch(function(e) {
              console.log(e);
              document.getElementById("statusSetUser").innerHTML = ("Error creating user. See log");
          });
  };
/*this.Bright.getUser.call(this.account.address, (err, res) => {
          console.log(res[0]);
          if (err) {
        console.log('oh no');
          }});
  public savebase64AsFile(folderPath, fileName, base64, contentType){
    var DataBlob = b64toBlob(base64,contentType);
    window.resolveLocalFileSystemURL(folderPath, function(dir) {
        dir.getFile(fileName, {create:true}, function(file) {
            file.createWriter(function(fileWriter) {
                fileWriter.write(DataBlob);
                fileWriter.onwrite = function(){
                    console.log('File written successfully.');
                }
            }, function(){
                alert('Unable to save file in path '+ folderPath);
            });
        });
    });
}*/



}



