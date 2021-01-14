import { Component, Output, EventEmitter } from "@angular/core";
import { NavController, PopoverController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { ILogger, LoggerService } from "../../core/logger.service";
import { TermsAndConditions } from "../../pages/termsandconditions/termsandconditions";
import { default as Web3 } from "web3";


@Component({
    selector: "new-user-form",
    templateUrl: "new-user-form.component.html",
    styles: ["new-user-form.component.scss"]
})

export class NewUserForm {

    @Output()
    public goToLogin = new EventEmitter();

    public file: Blob;
    public isUserCreated = false;
    public isTermsAgreed = false;

    private readonly LOGIN = "login";

    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        public popoverCtrl: PopoverController,
        public http: HttpClient,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("NewUserPage");
    }

    public createUser(pass: string) {
        const web3 = new Web3();
        let createAccount = web3.eth.accounts.create(web3.utils.randomHex(32));
        let encrypted = web3.eth.accounts.encrypt(createAccount.privateKey, pass);
        const dataFile = new Blob([JSON.stringify(encrypted)], { type: "text/plain" });
        this.file = dataFile;
        this.saveFileLink(this.file, "Identity.json");
        this.isUserCreated = true;
    }

    public toggleTerms(){
        this.isTermsAgreed = !this.isTermsAgreed;
    }

    public goToLoginForm(){
        this.goToLogin.next(this.LOGIN);
    }

    public showTerms(){
        let popover = this.popoverCtrl.create(TermsAndConditions, {},  {cssClass: "terms-popover"});
        popover.present();
    }

    public saveFileLink(contentinBlob: Blob, filename: string) {

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
    }

}
