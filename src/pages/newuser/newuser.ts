import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { default as Web3 } from "web3";
import { ContractManagerService } from "../../core/contract-manager.sevice";

@Component({
    selector: "page-newuser",
    templateUrl: "newuser.html"
})

export class NewuserPage {
    
    public account: any;
    public web3: Web3;
    private log: ILogger;
    public file: Blob;

    constructor(
        public navCtrl: NavController, 
        public http: HttpClient, 
        private loggerSrv: LoggerService, 
        private web3Service: Web3Service,
        private contractManager: ContractManagerService
    ) {
        this.log = this.loggerSrv.get("NewUserPage");
        this.web3 = this.web3Service.getWeb3();
      
    }

    public createUser(pass: string){
        this.contractManager.createUser(pass)
        .then((resolve)=>{
            this.file = resolve;
            this.saveFileLink(this.file, "Identity.json");
            document.getElementById("downButton").style.display = "block"; //TODO: Change this and use property [hidden] of angular
    
        });
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
            (window.URL).revokeObjectURL(save.href);
        };
        reader.readAsDataURL(contentinBlob);
    };

}


