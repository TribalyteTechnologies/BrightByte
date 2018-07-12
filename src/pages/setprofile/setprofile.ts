import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { LoginService } from "../../core/login.service";
import { HttpClient } from "@angular/common/http";
import { TabsPage } from "../../pages/tabs/tabs";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "page-setprofile",
    templateUrl: "setprofile.html"
})
export class SetProfilePage {
    public myForm: FormGroup;
    public isButtonPressed: boolean;
    public msg: string;
    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        loggerSrv: LoggerService,
        public fb: FormBuilder,
        public translateService: TranslateService,
        public http: HttpClient,
        private contractManagerService: ContractManagerService,
        private loginService: LoginService
    ) {
        this.log = loggerSrv.get("SetProfilePage");
        this.myForm = this.fb.group({
            name: ["", [Validators.required]],
            email: ["", Validators.compose([Validators.required, Validators.email])]
        });
    }

    public updateProfile(name: string, mail: string) {
        this.isButtonPressed = true;
        this.contractManagerService.getAllUserEmail()
            .then((arrayEmails: string[]) => {
                this.log.d("ARRAY Emails: ", arrayEmails);
                let isEmailUsed = (arrayEmails.indexOf(mail) >= 0);
                if (!isEmailUsed) {
                    this.contractManagerService.setProfile(name, mail)
                        .then(txResponse => {
                            this.log.d("Contract manager response: ", txResponse);
                            if (txResponse) {
                                this.navCtrl.push(TabsPage);
                            } else {
                                throw "Error: setreview response is undefine";
                            }
                        }).catch((e) => {
                            this.translateService.get("setProfile.tx").subscribe(
                                msg => {
                                    this.msg = msg;
                                    this.log.e(msg, e);
                                });
                        });
                } else {
                    this.isButtonPressed = false;
                    this.translateService.get("setProfile.emailUsed").subscribe(
                        msg => {
                            this.msg = msg;
                        });
                }
            }).catch((e) => {
                this.translateService.get("setProfile.getEmails").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });


    }
}
