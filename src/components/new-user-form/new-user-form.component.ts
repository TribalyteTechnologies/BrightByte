import { Component, Output, EventEmitter } from "@angular/core";
import { NavController, PopoverController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { ILogger, LoggerService } from "../../core/logger.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TermsAndConditions } from "../../pages/termsandconditions/termsandconditions";


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
        loggerSrv: LoggerService,
        private contractManager: ContractManagerService
    ) {
        this.log = loggerSrv.get("NewUserPage");
    }

    public createUser(pass: string) {
        this.contractManager.createUser(pass)
            .then((dataFile) => {
                this.file = dataFile;
                this.saveFileLink(this.file, "Identity.json");
                this.isUserCreated = true;

            });
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
