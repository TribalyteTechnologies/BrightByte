import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { utf8Encode } from '@angular/compiler/src/util';
import { NewuserPage } from '../newuser/newuser'
import { default as Web3 } from 'web3';
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  web3: any;
  account: any;
  public text: any;
  public TextDepuracion: any;

  constructor(public navCtrl: NavController) {
        this.web3 = new Web3(new Web3.providers.HttpProvider("http://52.209.188.78:22000"));
        Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
  }
  
  public openFile = (event: Event)=> {
    console.log("Event: ", event);
    let target = <HTMLInputElement>event.target;
    let uploadedArray = <FileList>target.files;
    console.log("Target: ", target);
    
    let input = uploadedArray[0];
    console.log("Input: ", input);

    let reader = new FileReader();
    reader.readAsText(input);
    let me = this;
    reader.onload = function(){
      //let dataURL = reader.result;
      //let output = document.getElementById('output');
      //output.innerHTML = dataURL;
      //console.log(dataURL);
      me.TextDepuracion=reader.result;
      me.text = JSON.parse(reader.result); 
      //me.text = reader.result;
      //console.log(me.text);
    };
    // this.text=reader.readAsText(input);
    //console.log("Reader result: ", this.text);
    
  };
  //}
  public login(Pass){
    console.log(this.text);
    let PrivK = this.text.Keys.privateKey;
    this.account = this.web3.eth.accounts.decrypt(PrivK, Pass);
    console.log("Imported account from the login file: ",this.account);
  }
public register(){
    this.navCtrl.push(NewuserPage);
}

//ESTA FUNCION SE PODRIA QUITAR. VER QUE DICE EL PRODUCT OWNER
public Pkey(PrivatePass){
  //TODO First i have to check if the account is located in BrightByte because if not i would have to denied the recover and Put a message saying Please Create a user.
  this.account = this.web3.eth.accounts.privateKeyToAccount(PrivatePass);
  console.log("Imported account from PK",this.account);
}
}
