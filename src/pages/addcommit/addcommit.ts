import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { LoginService } from "../../core/login.service";
import { ViewController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";
import { AppConfig } from "../../app.config";
import { UserDetails } from "../../models/user-details.model";

@Component({
    selector: "popover-addcommit",
    templateUrl: "addcommit.html"
})
export class AddCommitPopover {
    public isAddInputAllowed = true;
    public numberInputs = [""];
    public isTxOngoing = false;
    public msg: string;
    public usersMail = ["", "", "", ""];
    public arrayEmails: string[];
    public arraySearch: string[];
    public userDetails: UserDetails;
    public isShowList = new Array<boolean>();
    public myForm: FormGroup;
    private log: ILogger;
    private initProm;

    constructor(
        public navCtrl: NavController,
        public viewCtrl: ViewController,
        public http: HttpClient,
        public fb: FormBuilder,
        public translateService: TranslateService,
        loggerSrv: LoggerService,
        private contractManagerService: ContractManagerService,
        public loginService: LoginService
    ) {
        this.log = loggerSrv.get("AddCommitPage");
        this.contractManagerService.getAllUserEmail()
            .then((allEmails: string[]) => {
                this.log.d("ARRAY Emails: ", allEmails);
                this.arrayEmails = allEmails;
            }).catch((e) => {
                this.translateService.get("addCommit.errorEmails").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
        this.myForm = this.fb.group({
            url: ["", [Validators.required,
            Validators.pattern(/^(https)(:)\/\/(bitbucket)\.(org)\/[a-z0-9]+\/[a-z0-9]+\/(commits)\/[a-z0-9]+$/)]],
            title: ["", [Validators.required]]
        });
        this.initProm = this.contractManagerService.getUserDetails(this.loginService.getAccount().address)
        .then((userDetails: UserDetails) => {
            this.userDetails = userDetails;
        }).catch((e) => {
            this.log.d("Error checking if you are trying to review your own commit: ", e);
        });
    }
    public addCommit(url: string, title: string) {
        this.isTxOngoing = true;
        this.msg = "";
        let isPermitted = true;
        this.initProm.then(() => {
            for (let i = 0; i < AppConfig.MAX_REVIEWER_COUNT; i++) {
                for(let j=0;j<AppConfig.MAX_REVIEWER_COUNT; j++){
                if (this.usersMail[i] === this.usersMail[j] && i !== j && this.usersMail[i] !== "") {
                    this.translateService.get("addCommit.emailDuplicated").subscribe(
                        msg => {
                            this.msg = msg;
                        });
                        isPermitted = false;
                        this.isTxOngoing = false;
                        this.log.d("ERROR: inside first check");
                }
            }
                if (this.usersMail[i] === this.userDetails.email) {
                    this.translateService.get("addCommit.ownEmail").subscribe(
                        msg => {
                            this.msg = msg;
                        });
                    isPermitted = false;
                    this.isTxOngoing = false;
                    break;
                }
                
            }
            if (isPermitted) {
                this.contractManagerService.getDetailsCommits(url)
                    .then((detailsCommits) => {
                        if (detailsCommits.url !== "") {
                            this.isTxOngoing = false;
                            this.translateService.get("addCommit.urlDuplicated").subscribe(
                                msg => {
                                    this.msg = msg;
                                    this.log.w(msg);
                                });
                        } else {
                            this.contractManagerService.addCommit(url, title, this.usersMail)
                                .then(txResponse => {
                                    this.log.d("Contract manager response: ", txResponse);
                                    if (txResponse) {
                                        this.viewCtrl.dismiss();
                                    } else {
                                        throw "Error: addcommit response is undefined";
                                    }
                                }).catch((e) => {
                                    this.isTxOngoing = false;
                                    this.translateService.get("addCommit.addingCommit").subscribe(
                                        msg => {
                                            this.msg = msg;
                                            this.log.e(msg, e);
                                        });
                                });
                        }
                    }).catch((e) => {
                        this.isTxOngoing = false;
                        this.translateService.get("addCommit.commitDetails").subscribe(
                            msg => {
                                this.msg = msg;
                                this.log.e(msg, e);
                            });
                    });
        
                }
        });
            
                
        
        

    }

    public getItems(ev: any, id: number) { //TODO: TYpe targetevent or event
        for (let i = 0; i < 4; i++) {
            this.isShowList[i] = false;
        }
        // set val to the value of the ev target
        let val = ev.target.value;
        // if the value is an empty string don't filter the items
        if (val && val.trim()) {
            this.arraySearch = this.arrayEmails.filter((item) => {
                return (item.toLowerCase().indexOf(val.toLowerCase()) > -1);
            });
        }
        this.isShowList[id] = true;
    }
    public setEmailFromList(num: number, item: string) {
        let isDuplicated = false;
        this.initProm.then(() => {
        for (let i = 0; i < AppConfig.MAX_REVIEWER_COUNT; i++) {
            if(item === this.userDetails.email){
                this.translateService.get("addCommit.ownEmail").subscribe(
                    msg => {
                        this.msg = msg;
                    });
                isDuplicated = true;
                break;
            }
            if (this.usersMail[i] === item) {
                this.translateService.get("addCommit.emailDuplicated").subscribe(
                    msg => {
                        this.msg = msg;
                    });
                isDuplicated = true;
                break;
            }
        }
        if (!isDuplicated) {
            this.msg = "";
            this.usersMail[num] = item;
            this.isShowList[num] = false;
        }
    });
    }
    public addInput() {
        if (this.isAddInputAllowed) {
            this.numberInputs.push("");
            this.isAddInputAllowed = (this.numberInputs.length < AppConfig.MAX_REVIEWER_COUNT);
        } else {
            this.log.d("Max fields already created");
        }
    }
}
