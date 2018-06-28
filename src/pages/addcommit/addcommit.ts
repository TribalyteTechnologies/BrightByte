import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { ViewController } from 'ionic-angular';
import { HttpClient } from "@angular/common/http";
import { default as contract } from "truffle-contract";
import { default as Web3 } from "web3";
import { ContractManagerService } from "../../core/contract-manager.service";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: "popover-addcommit",
    templateUrl: "addcommit.html"
})
export class AddCommitPopover {
    private log: ILogger;
    public web3: Web3;
    public account: any;
    public bright: any;
    public isButtonDisabled = false;
    public abi: any;
    public contract: any;
    public nonce: string;
    public abijson: any;
    public msg: string;
    public usersMail = ["", "", "", ""];
    public arrayEmails: string[];
    public arraySearch: string[];
    public isShowList = [false, false, false, false];
    public myForm: FormGroup;

    constructor(
        public navCtrl: NavController,
        public viewCtrl: ViewController,
        public http: HttpClient,
        public fb: FormBuilder,
        private loggerSrv: LoggerService,
        private web3Service: Web3Service,
        private contractManagerService: ContractManagerService,
        public loginService: LoginService
    ) {
        this.web3 = this.web3Service.getWeb3();
        this.log = this.loggerSrv.get("AddCommitPage");
        this.account = this.loginService.getAccount();
        this.account = this.loginService.getAccount();
        this.log.d("Imported account successfully", this.account);
        this.http.get("../assets/build/Bright.json").subscribe(data => {
            this.abijson = data;
            this.abi = data["abi"];
            this.bright = contract(this.abijson); //TruffleContract function
            this.contractManagerService.getAllUserEmail()
                .then((resolve) => {
                    this.log.d("ARRAY Emails: ", resolve);
                    this.arrayEmails = resolve;
                }).catch((e) => {
                    this.log.d("Error getting emails!!", e);
                    this.msg = "Error getting emails!!";
                });
        }, (err) => this.log.e(err), () => {
            //If you want do after the promise. Code here
            this.log.d("TruffleContract function: ", this.bright);
        });
        this.myForm = this.fb.group({
            url: ['', [Validators.required, Validators.pattern(/^(https)(:)\/\/(bitbucket)\.(org)\/(tribalyte)\/[a-z0-9]+\/(commits)\/[a-z0-9]+$/)]]
        });
    }
    public addCommit(url: string) {
        this.isButtonDisabled = true;
        this.msg = "";
        let urlSplitted = url.split("/");
        let id = urlSplitted[6];
        this.contractManagerService.getDetailsCommits(id)
            .then((resolve) => {
                if (resolve[0] != "") {
                    this.isButtonDisabled = false;
                    this.log.d("Error: email already in use");
                    this.msg = "Error: email already in use";
                } else {
                    this.contractManagerService.addCommit(url, this.usersMail)
                        .then((resolve) => {
                            this.log.d("Contract manager response: ", resolve);
                            if (resolve.blockNumber > 4929812) { // current block when i wrote this line
                                this.viewCtrl.dismiss();
                            }
                        }).catch((e) => {
                            this.isButtonDisabled = false;
                            this.log.d("Error adding new commit!!", e);
                            this.msg = "Error adding new commit";
                        });
                }
            }).catch((e) => {
                this.isButtonDisabled = false;
                this.log.d("Error getting commit details!!", e);
                this.msg = "Error getting commit details!!";
            });


    }

    getItems(ev, id) {
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
}
