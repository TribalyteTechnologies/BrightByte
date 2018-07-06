import { Injectable } from "@angular/core";
import { default as Web3 } from 'web3';
import { Web3Service } from "../core/web3.service";
import { UserAccount } from "../core/login.service";
import { ILogger, LoggerService } from "../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { default as TruffleContract } from "truffle-contract";
import { AppConfig } from "../app.config";
import Tx from "ethereumjs-tx";

interface TrbSmartContractJson {
    abi: Array<any>;
}

interface TrbSmartContact { //Web3.Eth.Contract
    [key: string]: any;
}

@Injectable()
export class ContractManagerService {
    private truffleContract: any;
    private log: ILogger;
    private web3: Web3;
    private initProm: Promise<TrbSmartContact>;
    private currentUser: UserAccount;

    constructor(
        public http: HttpClient,
        private web3Service: Web3Service,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ContractManagerService");
        this.web3 = this.web3Service.getWeb3();
    }

    public init(user: UserAccount): Promise<TrbSmartContact> {
        this.currentUser = user;
        this.log.d("Initializing service with user ", this.currentUser);
        this.initProm = this.http.get("../assets/build/Bright.json").toPromise()
            .then((jsonContractData: TrbSmartContractJson) => {
                this.truffleContract = TruffleContract(jsonContractData);
                let contractAddress = this.truffleContract.networks[AppConfig.NET_ID].address;
                let contract = new this.web3.eth.Contract(jsonContractData.abi, contractAddress, {
                    from: this.currentUser.address,
                    gas: AppConfig.GAS_LIMIT,
                    gasPrice: AppConfig.GASPRICE,
                    data: this.truffleContract.deployedBytecode
                });
                this.log.d("TruffleContract function: ", contract);
                return contract;
            });
        return this.initProm;
    }

    public createUser(pass: string): Promise<Blob> {
        let createAccount = this.web3.eth.accounts.create(this.web3.utils.randomHex(32));
        let encrypted = this.web3.eth.accounts.encrypt(createAccount.privateKey, pass);
        //The blob constructor needs an array as first parameter, so it is not neccessary use toString.
        //The second parameter is the MIME type of the file.
        return new Promise((resolve, reject) => {
            resolve(new Blob([JSON.stringify(encrypted)], { type: "text/plain" }));
            reject("Not initialized");
        });
    }
    public setProfile(name: string, mail: string): Promise<any> {
        let contractArtifact;
        return this.initProm.then(contract => {
            this.log.d("Contract: ", contract);
            contractArtifact = contract;
            this.log.d("Setting profile with name and mail: ", [name, mail]);
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return this.web3.eth.getTransactionCount(this.currentUser.address);
        }).then(transactionCount => {
            let nonce = "0x" + transactionCount.toString(16);
            let bytecodeData = contractArtifact.methods.setProfile(name, mail).encodeABI();
            this.log.d("Nonce value: ", nonce);
            this.log.d("Bytecode data: ", bytecodeData);
            let contractAddress = this.truffleContract.networks[AppConfig.NET_ID].address;
            this.log.d("Contract address: ", contractAddress);
            let rawtx = {
                nonce: nonce,
                gasPrice: this.web3.utils.toHex(AppConfig.GASPRICE), //web3.eth.getGasPrice() could be used to determine which is the gasPrise needed
                gasLimit: this.web3.utils.toHex(AppConfig.GAS_LIMIT),
                to: contractAddress,
                data: bytecodeData
            };
            const tx = new Tx(rawtx);
            let priv = this.currentUser.privateKey.substring(2);
            tx.sign(new Buffer(priv, "hex"));
            let raw = "0x" + tx.serialize().toString("hex");
            this.log.d("Rawtx: ", rawtx);
            this.log.d("Priv si 0x: ", priv);
            this.log.d("Raw: ", raw);
            this.log.d("tx unsign: ", tx);
            return this.web3.eth.sendSignedTransaction(raw, (err, transactionHash) => {
                if (!err) {
                    this.log.d("Hash transaction", transactionHash);
                } else {
                    this.log.e("Error sending signed transaction: ", err);
                }
            });
        }).catch(e => {
            this.log.e("Error setting profile: ", e);
            throw e;
        });
    }
    public addCommit(url: string, title: string,usersMail: string[]): Promise<any> {
        let contractArtifact;
        let contractAddress;
        return this.initProm.then(contract => {
            this.log.d("Contract artifact: ", contract);
            contractArtifact = contract;
            contractAddress = this.truffleContract.networks[AppConfig.NET_ID].address;
            this.log.d("Contract Address: ", contractAddress);
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Variables: url ", url);
            this.log.d("UsersMail: ", usersMail);

            return this.web3.eth.getTransactionCount(this.currentUser.address)
        }).then(nonceValue => {
            let nonce = "0x" + (nonceValue).toString(16);
            this.log.d("Value NONCE", nonce);

            let urlSplitted = url.split("/");
            this.log.d("Url splited: ", urlSplitted);
            let project = urlSplitted[4];
            let id = urlSplitted[6];

            let data = contractArtifact.methods.setNewCommit(id, title, url, project, usersMail[0], usersMail[1], usersMail[2], usersMail[3]).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("Introduced user1: ", usersMail[0]);
            this.log.d("Introduced user2: ", usersMail[1]);
            this.log.d("Introduced user3: ", usersMail[2]);
            this.log.d("Introduced user4: ", usersMail[3]);

            this.log.d("DATA: ", data);

            let rawtx = {
                nonce: nonce,
                gasPrice: this.web3.utils.toHex(AppConfig.GASPRICE),
                gasLimit: this.web3.utils.toHex(AppConfig.GAS_LIMIT),
                to: contractAddress,
                data: data
            };
            const tx = new Tx(rawtx);
            let priv = this.currentUser.privateKey.substring(2);
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
    public getCommits(): Promise<string[] | void> {
        let contractArtifact;
        let contractAddress;
        return this.initProm.then(contract => {
            this.log.d("Contract artifact: ", contract);
            contractArtifact = contract;
            contractAddress = this.truffleContract.networks[AppConfig.NET_ID].address;
            this.log.d("Contract Address: ", contractAddress);
            this.log.d("Public Address: ", this.currentUser.address);
            return contractArtifact.methods.getNumberUserCommits().call();
        }).then(result => {
            let numberUserCommits = result;
            let promises = new Array<Promise<string>>();
            for (let i = 0; i < numberUserCommits; i++) {
                let promise = contractArtifact.methods.getUserCommits(i).call();
                promises.push(promise);
            }
            return Promise.all(promises);
        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
        });
    }

    public getAllUserEmail(): Promise<string[] | void> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return contractArtifact.methods.getAllUserNumber().call()
        }).then(numberUsers => {
            let promises = new Array<Promise<string>>();
            for (let i = 0; i < numberUsers; i++) {
                let promise = contractArtifact.methods.getAllUserEmail(i).call();
                promises.push(promise);
            }
            return Promise.all(promises);
        })

            .catch(err => {
                this.log.e("Error getting all user emails :", err);
            })
    }

    public getCommitsToReview(): Promise<any> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return contractArtifact.methods.getNumberCommitsToReviewByMe().call();
        }).then(result => {
            let numberUserCommits = result;
            this.log.d("NumberuserCommits: ", result);
            let promises = new Array<Promise<string>>();
            for (let i = 0; i < numberUserCommits; i++) {
                let promise = contractArtifact.methods.getCommitsToReviewByMe(i).call();
                promises.push(promise);
            }
            return Promise.all(promises);

        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
        });
    }
    public getDetailsCommits(id: string): Promise<boolean | number | string | null> {
        return this.initProm.then(contract => {
            let contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
        return contractArtifact.methods.getDetailsCommits(id).call()
        }).catch(err => {
                this.log.e("Error calling BrightByte smart contract :", err);
            });
    }

    public setReview(index: number, text: string, points: number): Promise<any> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
        return this.web3.eth.getTransactionCount(this.currentUser.address);
        }).then(result => {
                let nonce = "0x" + (result).toString(16);
                this.log.d("Value NONCE", nonce);
                let bytecodeData = contractArtifact.methods.setReview(index, text, points).encodeABI();
                this.log.d("Introduced index: ", index);
                this.log.d("Introduced text: ", text);
                this.log.d("Introduced points: ", points);
                this.log.d("DATA: ", bytecodeData);

                let rawtx = {
                    nonce: nonce,
                    gasPrice: this.web3.utils.toHex(AppConfig.GASPRICE),// I could use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                    gasLimit: this.web3.utils.toHex(AppConfig.GAS_LIMIT),
                    to: this.truffleContract.networks[AppConfig.NET_ID].address,
                    data: bytecodeData
                };
                const tx = new Tx(rawtx);
                let priv = this.currentUser.privateKey.substring(2);
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
    public getCommentsOfCommit(index: number): Promise<string[] | void> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
        return contractArtifact.methods.getNumberComments(index).call()
        }).then(result => {
                this.log.d("Number of comments: ", result);
                let numberOfComments = result;
                let promises = new Array<Promise<any>>();
                for (let i = 0; i < numberOfComments; i++) {
                    let promise = contractArtifact.methods.getCommentsOfCommit(index, i).call();
                    promises.push(promise);
                }
                return Promise.all(promises);

            }).catch(err => {
                this.log.e("Error calling BrightByte smart contract :", err);
            });
    }
    public getUserDetails(hash: string): Promise<Array<string | number>> {
        return this.initProm.then(contract => {
            let contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return contractArtifact.methods.getUser(hash).call()
                .catch(err => {
                    this.log.e("Error calling BrightByte smart contract :", err);
                });
        });
    }
}

