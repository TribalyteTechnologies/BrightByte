import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { utf8Encode } from '@angular/compiler/src/util';
import { NewuserPage } from '../newuser/newuser'
import { default as Web3 } from 'web3';
import {ILogger, LoggerService} from "../../core/logger.service";

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  web3: any;
  account: any;
  public text: any;
  public TextDepuracion: any;
  private log: ILogger;

  constructor(public navCtrl: NavController, private loggerSrv: LoggerService) {
        this.web3 = new Web3(new Web3.providers.HttpProvider("http://52.209.188.78:22000"));
        Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
        this.log = this.loggerSrv.get("LoginPage");
  }
  
  public openFile = (event: Event)=> {
    this.log.d("Event: ", event);
    let target = <HTMLInputElement>event.target;
    let uploadedArray = <FileList>target.files;
    this.log.d("Target: ", target);
    
    let input = uploadedArray[0];
    this.log.d("Input: ", input);

    let reader = new FileReader();
    reader.readAsText(input);
    reader.onload = (event: any) => {
      this.TextDepuracion=reader.result;
      this.text = JSON.parse(reader.result); 
      
    };
    
  };
  
  public login(Pass){
    this.log.d(this.text);
    let PrivK = this.text.Keys.privateKey;
    this.account = this.web3.eth.accounts.decrypt(PrivK, Pass);
    this.log.d("Imported account from the login file: ",this.account);
  }
  
public register(){
    this.navCtrl.push(NewuserPage);
}
}