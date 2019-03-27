import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { TabsPage } from "../../pages/tabs/tabs";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";
import { UserReputation } from "../../models/user-reputation.model";

@Component({
    selector: "set-profile-form",
    templateUrl: "set-profile-form.component.html",
    styles: ["set-profile-form.component.scss"]
})

export class SetProfileForm {
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
        private contractManagerService: ContractManagerService
    ) {
        this.log = loggerSrv.get("SetProfilePage");
        this.myForm = this.fb.group({
            name: ["", [Validators.required]],
            email: ["", Validators.compose([Validators.required, Validators.email])]
        });
    }

    public updateProfile(name: string, mail: string) {
        this.isButtonPressed = true;
        this.contractManagerService.getAllUserReputation()
        .then((arrayEmails: UserReputation[]) => {
            let emails = arrayEmails.map(ur => ur.email);
            this.log.d("ARRAY Emails: ", arrayEmails);
            let isEmailUsed = (emails.indexOf(mail) >= 0);
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

