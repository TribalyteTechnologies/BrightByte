import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import {ILogger, LoggerService} from "../../core/logger.service";
import {Web3Service} from "../../core/web3.service";
import {LoginService} from "../../core/login.service";
import { ViewController } from 'ionic-angular';
import {HttpClient} from "@angular/common/http";
import { default as contract }  from "truffle-contract";
import { default as Web3 } from "web3";
import { ContractManagerService } from "../../core/contract-manager.service";

@Component({
	selector: "popover-addcommit",
	templateUrl: "addcommit.html"
})
export class AddCommitPopover {
    private log: ILogger;
	public web3: Web3;
	public account: any;
    public bright: any;
    public abi: any;
    public contract: any;
    public nonce: string;
    public abijson: any;
    public msg: string;
    public usersMail = ["","","",""];

    constructor(
        public navCtrl: NavController,
        public viewCtrl: ViewController,
        public http: HttpClient, 
        private loggerSrv: LoggerService, 
        private web3Service: Web3Service,
        private contractManagerService: ContractManagerService, 
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
     public addCommit(url: string, project: string){
        this.contractManagerService.addCommit(url, project, this.usersMail)
        .then((resolve)=>{
			this.log.d("Respuesta del contract manager: ", resolve);
            if(resolve.status == true){
                this.viewCtrl.dismiss();
            }
        }).catch((e)=>{
			this.log.d("Error adding new commit!!",e);
			this.msg = "Error adding new commit";
		});
        
        
     }
     
}
