import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { ViewController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { default as contract } from "truffle-contract";
import { default as Web3 } from "web3";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";
import { Split } from "../../domain/split.service";

@Component({
    selector: "popover-addcommit",
    templateUrl: "addcommit.html"
})
export class AddCommitPopover {
    public web3: Web3;
    public account: any;
    public bright: any;
    public isButtonDisabled = false;
    public abi: any;
    public contract: any;
    public isAddInputAllowed = true;
    public nonce: string;
    public numberInputs = [""];
    public isTxOngoing = false;
    public abijson: any;
    public msg: string;
    public usersMail = ["", "", "", ""];
    public arrayEmails: string[];
    public arraySearch: string[];
    public isShowList = new Array<boolean>();
    public myForm: FormGroup;
    private log: ILogger;
    private MAX_REVIEWER_COUNT = 4;

    constructor(
        public navCtrl: NavController,
        public viewCtrl: ViewController,
        public http: HttpClient,
        public fb: FormBuilder,
        public translateService: TranslateService,
        loggerSrv: LoggerService,
        private split: Split,
        private web3Service: Web3Service,
        private contractManagerService: ContractManagerService,
        public loginService: LoginService
    ) {
        this.web3 = this.web3Service.getWeb3();
        this.log = loggerSrv.get("AddCommitPage");
        this.account = this.loginService.getAccount();
        this.account = this.loginService.getAccount();
        this.log.d("Imported account successfully", this.account);
        this.http.get("../assets/build/Bright.json").subscribe(
            data => {
                this.abijson = data;
                this.abi = data["abi"];
                this.bright = contract(this.abijson); //TruffleContract function
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
                this.log.d("TruffleContract function: ", this.bright);
            },
            err => this.log.e(err));
        this.myForm = this.fb.group({
            url: ["", [Validators.required,
            Validators.pattern(/^(https)(:)\/\/(bitbucket)\.(org)\/(tribalyte)\/[a-z0-9]+\/(commits)\/[a-z0-9]+$/)]],
            title: ["", [Validators.required]]
        });
    }
    public addCommit(url: string, title: string) {
        this.isTxOngoing = true;
        this.msg = "";
        let projectAndId = this.split.splitIDAndProject(url);
        let id = projectAndId[1];
        this.contractManagerService.getDetailsCommits(id)
            .then((detailsCommits) => {
                if (detailsCommits[0] !== "") {
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

    public getItems(ev: any, id: number) { //TODO: TYpe targetevent or event
        for (let i = 0; i < 4; i++) {
            this.isShowList[i] = false;
        }
        // set val to the value of the ev target
        let val = ev.target.value;
        // if the value is an empty string don't filter the items
        if (val && val.trim() !== "") {
            this.arraySearch = this.arrayEmails.filter((item) => {
                return (item.toLowerCase().indexOf(val.toLowerCase()) > -1);
            });
        }
        this.isShowList[id] = true;
    }
    public setEmailFromList(num, item) {
        let isDuplicated = false;
        for (let i = 0; i < 4; i++) {
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
    }
    public addInput() {
        if (this.isAddInputAllowed) {
            this.numberInputs.push("");
            this.isAddInputAllowed = (this.numberInputs.length < this.MAX_REVIEWER_COUNT);
        } else {
            this.log.d("Max fields already created");
        }
    }
}
