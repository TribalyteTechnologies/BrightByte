import { Injectable } from "@angular/core";
import { default as Web3 } from 'web3';
import { Web3Service } from "../core/web3.service";
import { LoginService } from "../core/login.service";
import { ILogger, LoggerService } from "../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { default as contract } from "truffle-contract";
import { AppConfig } from "../app.config";
import Tx from "ethereumjs-tx";

@Injectable()
export class ContractManagerService {

    private createAccount: any;
    private log: ILogger;
    private account: any;
    private nonce: string;
    private web3: Web3;
    public contract: any;
    public abi: any;
    public abijson: any;
    public bright: any;
    public contractAddress: any;

    constructor(
        public http: HttpClient,
        private web3Service: Web3Service,
        private loggerSrv: LoggerService,
        private loginService: LoginService
    ) {
        this.log = this.loggerSrv.get("ContractManagerService");
        this.web3 = this.web3Service.getWeb3();
        this.account = this.loginService.getAccount();
        this.log.d("account: ", this.account);
        this.http.get("../assets/build/Bright.json").subscribe(data => {
            this.abijson = data;
            this.abi = data["abi"];
            this.bright = contract(this.abijson); //TruffleContract function
            this.contractAddress = this.bright.networks[AppConfig.NET_ID].address;
        }, (err) => this.log.e(err), () => {
            //If you want do after the promise. Code here
            this.log.d("TruffleContract function: ", this.bright);
        });
        this.log.d("Constructor account: ", this.account);
    }

    public createUser(pass: string): Promise<Blob> {
        this.createAccount = this.web3.eth.accounts.create(this.web3.utils.randomHex(32));
        let encrypted = this.web3.eth.accounts.encrypt(this.createAccount.privateKey, pass);
        let text = [];
        text.push('{"Keys":{');
        text.push('"address":' + JSON.stringify(this.createAccount.address) + ',"privateKey":' + JSON.stringify(encrypted) + '}}');
        //The blob constructor needs an array as first parameter, so it is not neccessary use toString.
        //The second parameter is the MIME type of the file.
        return new Promise((resolve, reject) => {
            resolve(new Blob(text, {
                type: "text/plain"
            }));
        });
    }
    public setProfile(name: string, mail: string): Promise<any>{
        this.getAccountAndContract();

        this.log.d("account: ", this.account);
        this.log.d("Contract Address: ", this.bright.networks[AppConfig.NET_ID].address);
        this.log.d("Public Address: ", this.account.address);
        this.log.d("Contract artifact", this.contract);

        return this.web3.eth.getTransactionCount(this.account.address)
            .then(result => {
                this.nonce = "0x" + (result).toString(16);
                this.log.d("Value NONCE", this.nonce);
                let data = this.contract.methods.setProfile(name, mail).encodeABI();
                this.log.d("Introduced name: ", name);
                this.log.d("Introduced Mail: ", mail);
                this.log.d("DATA: ", data);

                let rawtx = {
                    nonce: this.nonce,
                    gasPrice: this.web3.utils.toHex(AppConfig.GASPRICE),// I could use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                    gasLimit: this.web3.utils.toHex(AppConfig.GAS_LIMIT),
                    to: this.bright.networks[AppConfig.NET_ID].address,
                    data: data
                };
                const tx = new Tx(rawtx);
                let priv = this.account.privateKey.substring(2);
                let privateKey = new Buffer(priv, "hex");
                tx.sign(privateKey);

                let raw = "0x" + tx.serialize().toString("hex");
                this.log.d("Rawtx: ", rawtx);
                this.log.d("Priv si 0x: ", priv);
                this.log.d("privatekey: ", privateKey);
                this.log.d("Raw: ", raw);
                this.log.d("tx unsign: ", tx);
                return this.web3.eth.sendSignedTransaction(raw, (err, transactionHash) => {
                    if (!err) {
                        this.log.d("Hash transaction", transactionHash);
                    } else {
                        this.log.e(err);
                    }
                });

            }).catch(e => {
                this.log.e("Error getting nonce value: ", e);
            });

    }
    public addCommit(url: string, usersMail: string[]): Promise<any> {
        this.getAccountAndContract();
        let contractAddress = this.bright.networks[AppConfig.NET_ID].address;
        this.log.d("Contract Address: ", contractAddress);
        this.log.d("Public Address: ", this.account.address);
        this.log.d("Variables: url ",url);
        this.log.d("UsersMail: ",usersMail);
        this.log.d("Contract artifact", this.contract);

        return this.web3.eth.getTransactionCount(this.account.address)
            .then(result => {
                this.nonce = "0x" + (result).toString(16);
                this.log.d("Value NONCE", this.nonce);

                let urlSplitted = url.split("/"); 
                this.log.d("Url splited: ",urlSplitted);
                let project = urlSplitted[4];
                let id = urlSplitted[6];

                let data = this.contract.methods.setNewCommit(id, url, project, usersMail[0], usersMail[1], usersMail[2], usersMail[3]).encodeABI();
                this.log.d("Introduced url: ", url);
                this.log.d("Introduced project: ", project);
                this.log.d("Introduced user1: ", usersMail[0]);
                this.log.d("Introduced user2: ", usersMail[1]);
                this.log.d("Introduced user3: ", usersMail[2]);
                this.log.d("Introduced user4: ", usersMail[3]);

                this.log.d("DATA: ", data);

                let rawtx = {
                    nonce: this.nonce,
                    gasPrice: this.web3.utils.toHex(AppConfig.GASPRICE),
                    gasLimit: this.web3.utils.toHex(AppConfig.GAS_LIMIT),
                    to: contractAddress,
                    data: data
                };
                const tx = new Tx(rawtx);
                let priv = this.account.privateKey.substring(2);
                let privateKey = new Buffer(priv, "hex");
                tx.sign(privateKey);

                let raw = "0x" + tx.serialize().toString("hex");
                this.log.d("Rawtx: ", rawtx);
                this.log.d("Priv si 0x: ", priv);
                this.log.d("privatekey: ", privateKey);
                this.log.d("Raw: ", raw);
                this.log.d("tx unsign: ", tx);
                return this.web3.eth.sendSignedTransaction(raw, (err, transactionHash) => {
                    if (!err) {
                        this.log.d("Hash transaction", transactionHash);
                    } else {
                        this.log.e("Error sending the transaction addcommit: ", err);
                    }
                });
            }).catch(e => {
                this.log.e("Error getting nonce in addcommit: ", e);
            });
    }
    public getCommits(): Promise<any> {
        this.account = this.loginService.getAccount();
        return this.http.get("../assets/build/Bright.json").toPromise().then(data => {
            this.abijson = data;
            this.abi = data["abi"];
            this.bright = contract(this.abijson); //TruffleContract function
            this.contractAddress = this.bright.networks[AppConfig.NET_ID].address;
            return this.contract = new this.web3.eth.Contract(this.abi, this.contractAddress, {
                from: this.account.address,
                gas: AppConfig.GAS_LIMIT,
                gasPrice: AppConfig.GASPRICE,
                data: this.bright.deployedBytecode
            });
        }).then(() => {
            return this.contract.methods.getNumberUserCommits().call()
                .then(result => {
                    let numberUserCommits = result;
                    let promises = new Array<Promise<string>>();
                    for (let i = 0; i < numberUserCommits; i++) {
                        let promise = this.contract.methods.getUserCommits(i).call();
                        promises.push(promise);
                    }
                    return Promise.all(promises);
                })
        })
            .catch(err => {
                this.log.e("Error calling BrightByte smart contract :", err);
            });
    }
    public getAllUserEmail(): Promise<any> {
        this.account = this.loginService.getAccount();
        return this.http.get("../assets/build/Bright.json").toPromise().then(data => {
            this.abijson = data;
            this.abi = data["abi"];
            this.bright = contract(this.abijson); //TruffleContract function
            this.contractAddress = this.bright.networks[AppConfig.NET_ID].address;
            return this.contract = new this.web3.eth.Contract(this.abi, this.contractAddress, {
                from: this.account.address,
                gas: AppConfig.GAS_LIMIT,
                gasPrice: AppConfig.GASPRICE,
                data: this.bright.deployedBytecode
            });
        }).then(() => {
            return this.contract.methods.getAllUserNumber().call()
        }).then(numberUsers => {
                    let promises = new Array<Promise<string>>();
                    for (let i = 0; i < numberUsers; i++) {
                        let promise = this.contract.methods.getAllUserEmail(i).call();
                        promises.push(promise);
                    }
                    return Promise.all(promises);
                })
        
            .catch(err => {
                this.log.e("Error getting all user emails :", err);
            })
    }
    private getAccountAndContract(){
        this.account = this.loginService.getAccount();
        this.contract = new this.web3.eth.Contract(this.abi, this.bright.networks[AppConfig.NET_ID].address, {
            from: this.account.address,
            gas: AppConfig.GAS_LIMIT,
            gasPrice: AppConfig.GASPRICE,
            data: this.bright.deployedBytecode
        });
    }
    public getCommitsToReview(){
        this.account = this.loginService.getAccount();
        return this.http.get("../assets/build/Bright.json").toPromise().then(data => {
            this.abijson = data;
            this.abi = data["abi"];
            this.bright = contract(this.abijson); //TruffleContract function
            this.contract = new this.web3.eth.Contract(this.abi, this.bright.networks[AppConfig.NET_ID].address, {
                from: this.account.address,
                gas: AppConfig.GAS_LIMIT,
                gasPrice: AppConfig.GASPRICE,
                data: this.bright.deployedBytecode
            });
        }).then(() => {
            return this.contract.methods.getNumberCommitsToReviewByMe().call()
                .then(result => {
                    let numberUserCommits = result;
                    this.log.d("NumberuserCommits: ",result);
                    let promises = new Array<Promise<string>>();
                    for (let i = 0; i < numberUserCommits; i++) {
                        let promise = this.contract.methods.getCommitsToReviewByMe(i).call();
                        promises.push(promise);
                    }
                    return Promise.all(promises);
                })
        })
            .catch(err => {
                this.log.e("Error calling BrightByte smart contract :", err);
            });
    }
    public getDetailsCommits(id: string): Promise<Object>{
        return this.contract.methods.getDetailsCommits(id).call()
                .then(details => {
                    return details;
        }).catch(err => {
                this.log.e("Error calling BrightByte smart contract :", err);
            });
    }

    public setReview(index: number, text: string): Promise<any>{
        this.getAccountAndContract();

        this.log.d("account: ", this.account);
        this.log.d("Contract Address: ", this.bright.networks[AppConfig.NET_ID].address);
        this.log.d("Public Address: ", this.account.address);
        this.log.d("Contract artifact", this.contract);

        return this.web3.eth.getTransactionCount(this.account.address)
            .then(result => {
                this.nonce = "0x" + (result).toString(16);
                this.log.d("Value NONCE", this.nonce);
                let data = this.contract.methods.setReview(index, text).encodeABI();
                this.log.d("Introduced index: ", index);
                this.log.d("Introduced text: ", text);
                this.log.d("DATA: ", data);

                let rawtx = {
                    nonce: this.nonce,
                    gasPrice: this.web3.utils.toHex(AppConfig.GASPRICE),// I could use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                    gasLimit: this.web3.utils.toHex(AppConfig.GAS_LIMIT),
                    to: this.bright.networks[AppConfig.NET_ID].address,
                    data: data
                };
                const tx = new Tx(rawtx);
                let priv = this.account.privateKey.substring(2);
                let privateKey = new Buffer(priv, "hex");
                tx.sign(privateKey);

                let raw = "0x" + tx.serialize().toString("hex");
                this.log.d("Rawtx: ", rawtx);
                this.log.d("Priv si 0x: ", priv);
                this.log.d("privatekey: ", privateKey);
                this.log.d("Raw: ", raw);
                this.log.d("tx unsign: ", tx);
                return this.web3.eth.sendSignedTransaction(raw, (err, transactionHash) => {
                    if (!err) {
                        this.log.d("Hash transaction", transactionHash);
                    } else {
                        this.log.e(err);
                    }
                });

            }).catch(e => {
                this.log.e("Error getting nonce value: ", e);
            });

    }
    public getCommentsOfCommit(index: number): Promise<any>{
        return this.contract.methods.getNumberComments(index).call()
                .then(result => {
                    this.log.d("Number of comments: ",result);
                    let numberOfComments = result;
                    let promises = new Array<Promise<any>>();
                    for (let i = 0; i < numberOfComments; i++) {
                        let promise = this.contract.methods.getCommentsOfCommit(index, i).call();
                        promises.push(promise);
                    }
                    return Promise.all(promises);
                
                }).catch(err => {
                        this.log.e("Error calling BrightByte smart contract :", err);
                    });
    }
}

