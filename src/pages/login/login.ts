import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { utf8Encode } from "@angular/compiler/src/util";
import { NewuserPage } from "../newuser/newuser"
import {ILogger, LoggerService} from "../../core/logger.service";
import {Web3Service} from "../../core/web3.service";
import {LoginService} from "../../core/login.service";
import { TabsPage } from "../../pages/tabs/tabs";


@Component({
    selector: "page-login",
    templateUrl: "login.html"
})

export class LoginPage {
    public web3: any;
    public account: any;
    public text: any;
    public textDebugging: string;
    private log: ILogger;

    constructor(
        public navCtrl: NavController, 
        private loggerSrv: LoggerService, 
        private web3Service: Web3Service,
        private loginService: LoginService
    ) {

        this.web3 = this.web3Service.getWeb3();
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
            this.textDebugging=reader.result;
            this.text = JSON.parse(reader.result); 
        };
    };
  
    public login(Pass: string){
        this.log.d(this.text);
        let privK = this.text.Keys.privateKey;
        this.account = this.web3.eth.accounts.decrypt(privK, Pass);
        this.log.d("Imported account from the login file: ",this.account);
        this.loginService.setAccount(this.account);
        this.navCtrl.push(TabsPage);//, {account: this.account});
    }
  
    public register(){
        this.navCtrl.push(NewuserPage);
    }

}