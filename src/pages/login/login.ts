import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { default as contract } from "truffle-contract";
import { default as Web3 } from "web3";
import { TranslateService } from "@ngx-translate/core";

import { NewuserPage } from "../newuser/newuser"
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { TabsPage } from "../../pages/tabs/tabs";
import { AppConfig } from "../../app.config";
import { SetProfilePage } from "../../pages/setprofile/setprofile";

@Component({
    selector: "page-login",
    templateUrl: "login.html"
})

export class LoginPage {

    public web3: Web3;
    public msg: string;
    public account: any;
    public text: any;
    public contract: any;
    public abi: any;
    public abijson: any;
    public bright: any;
    public textDebugging: string;
    public isDebugMode: boolean;
    private log: ILogger;

    constructor(public navCtrl: NavController,
        public http: HttpClient,
        public translateService: TranslateService,
        loggerSrv: LoggerService,
        private web3Service: Web3Service,
        private loginService: LoginService
    ) {
        this.web3 = this.web3Service.getWeb3();
        this.log = loggerSrv.get("LoginPage");
        this.isDebugMode = AppConfig.LOG_DEBUG;
        this.http.get("../assets/build/Bright.json").subscribe(data => {
            this.abijson = data;
            this.abi = data["abi"];
            this.bright = contract(this.abijson); //TruffleContract function
        }, (err) => this.log.e(err), () => {
            //If you want do after the promise. Code here
            this.log.d("TruffleContract function: ", this.bright);
        });
    }

    public openFile = (event: Event) => {
        this.log.d("Event: ", event);
        let target = <HTMLInputElement>event.target;
        let uploadedArray = <FileList>target.files;
        this.log.d("Target: ", target);
        let input = uploadedArray[0];
        if (input.type == "application/json") {
            this.msg = "";
            this.log.d("Input: ", input);
            let reader = new FileReader();
            reader.readAsText(input);
            reader.onload = (event: any) => {
                this.textDebugging = reader.result;
                this.text = JSON.parse(reader.result);
            };
        } else {
            this.translateService.get("app.wrongFile").subscribe(
                result => {
                    this.msg = result;
                },
                err => {
                    this.log.e("Error translating string", err);
                });
        }
    };

    public login(pass: string) {
        try {
            this.log.d(this.text);
            let privK = this.text.Keys.privateKey;

            this.account = this.web3.eth.accounts.decrypt(privK, pass)
            this.log.d("Imported account from the login file: ", this.account);
            this.loginService.setAccount(this.account);

            let contractAddress = this.bright.networks[AppConfig.NET_ID].address;
            this.log.d("Contract address: ", contractAddress);
            this.contract = new this.web3.eth.Contract(this.abi, contractAddress, {
                from: this.account.address,
                gas: AppConfig.GAS_LIMIT,
                gasPrice: AppConfig.GASPRICE,
                data: this.bright.deployedBytecode
            });
            this.contract.methods.getUser(this.account.address).call()
                .then((dataUser) => {
                    let posEmail = 1;
                    if (dataUser[posEmail] == "") {
                        this.log.d("Email: ", dataUser[1]);
                        this.navCtrl.push(SetProfilePage);
                    } else {
                        this.log.d("Email: ", dataUser[1]);
                        this.navCtrl.push(TabsPage);
                    }
                }).catch((e) => {
                    this.translateService.get("app.noRpc").subscribe(
                        result => {
                            this.msg = result;
                        },
                        err => {
                            this.log.e("Error translating string", err);
                        });
                    this.log.e("ERROR getting user or checking if this user has already set his profile: ", e);
                });

        }
        catch (e) {
            if (e instanceof TypeError) {
                this.log.e("File not loaded: ", e);
                this.translateService.get("app.fileNotLoaded").subscribe(
                    result => {
                        this.msg = result;
                    },
                    err => {
                        this.log.e("Error translating string", err);
                    });
            } else if (e instanceof Error) {
                this.translateService.get("app.wrongPassword").subscribe(
                    result => {
                        this.msg = result;
                        this.log.e(result, e);
                    },
                    err => {
                        this.log.e("Error translating string", err);
                    });
            }
        }

    }

    public register() {
        this.navCtrl.push(NewuserPage);
    }

}
