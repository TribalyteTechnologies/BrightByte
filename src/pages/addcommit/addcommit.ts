import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { ViewController } from 'ionic-angular';
import { HttpClient } from "@angular/common/http";
import { default as contract } from "truffle-contract";
import { default as Web3 } from "web3";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from "@ngx-translate/core";

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
    public isTxOngoing = false;
    public abijson: any;
    public msg: string;
    public usersMail = ["", "", "", ""];
    public arrayEmails: string[];
    public arraySearch: string[];
    public isShowList: boolean[];
    public myForm: FormGroup;

    constructor(
        public navCtrl: NavController,
        public viewCtrl: ViewController,
        public http: HttpClient,
        public fb: FormBuilder,
        public translateService: TranslateService,
        loggerSrv: LoggerService,
        private web3Service: Web3Service,
        private contractManagerService: ContractManagerService,
        public loginService: LoginService
    ) {
        this.web3 = this.web3Service.getWeb3();
        this.log = loggerSrv.get("AddCommitPage");
        this.isShowList = [false, false, false, false];
        this.account = this.loginService.getAccount();
        this.account = this.loginService.getAccount();
        this.log.d("Imported account successfully", this.account);
        this.http.get("../assets/build/Bright.json").subscribe(data => {
            this.abijson = data;
            this.abi = data["abi"];
            this.bright = contract(this.abijson); //TruffleContract function
            this.contractManagerService.getAllUserEmail()
                .then((resolve: string[]) => {
                    this.log.d("ARRAY Emails: ", resolve);
                    this.arrayEmails = resolve;
                }).catch((e) => {
                    this.translateService.get("addCommit.errorEmails").subscribe(
                        result => {
                            this.msg = result;
                            this.log.e(result, e);
                        },
                        err => {
                            this.log.e("Error translating string", err);
                        });
                });
        }, (err) => this.log.e(err), () => {
            //If you want do after the promise. Code here
            this.log.d("TruffleContract function: ", this.bright);
        });
        this.myForm = this.fb.group({
            url: ['', [Validators.required, Validators.pattern(/^(https)(:)\/\/(bitbucket)\.(org)\/(tribalyte)\/[a-z0-9]+\/(commits)\/[a-z0-9]+$/)]],
            title: ['', [Validators.required]]
        });
    }
    public addCommit(url: string, title: string) {
        this.isTxOngoing = true;
        this.msg = "";
        let urlSplitted = url.split("/");
        let id = urlSplitted[6];
        this.contractManagerService.getDetailsCommits(id)
            .then((resolve) => {
                if (resolve[0] != "") {
                    this.isTxOngoing = false;
                    this.translateService.get("addCommit.urlDuplicated").subscribe(
                        result => {
                            this.msg = result;
                            this.log.w(result);
                        },
                        err => {
                            this.log.e("Error translating string", err);
                        });
                } else {
                    this.contractManagerService.addCommit(url, title, this.usersMail)
                        .then((resolve) => {
                            this.log.d("Contract manager response: ", resolve);
                            if (resolve.status == true) { // current block when i wrote this line
                                this.viewCtrl.dismiss();
                            }
                        }).catch((e) => {
                            this.isTxOngoing = false;
                            this.translateService.get("addCommit.addingCommit").subscribe(
                                result => {
                                    this.msg = result;
                                    this.log.e(result, e);
                                },
                                err => {
                                    this.log.e("Error translating string", err);
                                });
                        });
                }
            }).catch((e) => {
                this.isTxOngoing = false;
                this.translateService.get("addCommit.commitDetails").subscribe(
                    result => {
                        this.msg = result;
                        this.log.e(result, e);
                    },
                    err => {
                        this.log.e("Error translating string", err);
                    });
            });

    }

    public getItems(ev: any, id: number) { //TODO: TYpe targetevent or event
        this.isShowList = [false, false, false, false];
        // set val to the value of the ev target
        let val = ev.target.value;
        // if the value is an empty string don't filter the items
        if (val && val.trim() != "") {
            this.arraySearch = this.arrayEmails.filter((item) => {
                return (item.toLowerCase().indexOf(val.toLowerCase()) > -1);
            })
        }
        this.isShowList[id] = true;
    }
    public setEmailFromList(number, item) {
        let isDuplicated = false;
        for (let i = 0; i < 4; i++) {
            if (this.usersMail[i] == item) {
                this.translateService.get("addCommit.emailDuplicated").subscribe(
                    result => {
                        this.msg = result;
                    },
                    err => {
                        this.log.e("Error translating string", err);
                    });
                isDuplicated = true;
            }
        }
        if (!isDuplicated) {
            this.msg = "";
            this.usersMail[number] = item;
            this.isShowList[number] = false;
        }
    }
}
