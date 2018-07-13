import { Injectable } from "@angular/core";
import { default as Web3 } from "web3";
import { Web3Service } from "../core/web3.service";
import { ILogger, LoggerService } from "../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { default as TruffleContract } from "truffle-contract";
import { AppConfig } from "../app.config";
import Tx from "ethereumjs-tx";
import { TransactionReceipt, Account } from "web3/types";
import { SplitService } from "../domain/split.service";
import { CommitDetails } from "../models/commit-details.model";
import { UserDetails } from "../models/user-details.model";
import { CommitComments } from "../models/commit-comments.model";

interface ItrbSmartContractJson {
    abi: Array<any>;
}

interface ItrbSmartContact { //Web3.Eth.Contract
    [key: string]: any;
}

@Injectable()
export class ContractManagerService {
    private contractAddress: string;
    private log: ILogger;
    private web3: Web3;
    private initProm: Promise<ItrbSmartContact>;
    private currentUser: Account;

    constructor(
        public http: HttpClient,
        private web3Service: Web3Service,
        private splitService: SplitService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ContractManagerService");
        this.web3 = this.web3Service.getWeb3();
    }

    public init(user: Account): Promise<ItrbSmartContact> {
        this.currentUser = user;
        this.log.d("Initializing service with user ", this.currentUser);
        this.initProm = this.http.get("../assets/build/Bright.json").toPromise()
            .then((jsonContractData: ItrbSmartContractJson) => {
                let truffleContract = TruffleContract(jsonContractData);
                this.contractAddress = truffleContract.networks[AppConfig.NETWORK_CONFIG.netId].address;
                let contract = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddress, {
                    from: this.currentUser.address,
                    gas: AppConfig.NETWORK_CONFIG.gasLimit,
                    gasPrice: AppConfig.NETWORK_CONFIG.gasPrice,
                    data: truffleContract.deployedBytecode
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
            let bytecodeData = contractArtifact.methods.setProfile(name, mail).encodeABI();
            this.log.d("Bytecode data: ", bytecodeData);

            return this.sendTx(bytecodeData);

        }).catch(e => {
            this.log.e("Error setting profile: ", e);
            throw e;
        });
    }
    public addCommit(url: string, title: string, usersMail: string[]): Promise<any> {
        let contractArtifact;
        return this.initProm.then(contract => {
            this.log.d("Contract artifact: ", contract);
            contractArtifact = contract;
            this.log.d("Contract Address: ", this.contractAddress);
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Variables: url ", url);
            this.log.d("UsersMail: ", usersMail);
            let id = this.splitService.getId(url);
            let project = this.splitService.getProject(url);
            let bytecodeData = contractArtifact.methods.setNewCommit(
                id,
                title,
                url,
                project,
                usersMail[0],
                usersMail[1],
                usersMail[2],
                usersMail[3]
            ).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("Introduced user1: ", usersMail[0]);
            this.log.d("Introduced user2: ", usersMail[1]);
            this.log.d("Introduced user3: ", usersMail[2]);
            this.log.d("Introduced user4: ", usersMail[3]);

            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData);

        }).catch(e => {
            this.log.e("Error getting nonce in addcommit: ", e);
            throw e;
        });
    }
    public getCommits(): Promise<string[] | void> {
        let contractArtifact;
        return this.initProm.then(contract => {
            this.log.d("Contract artifact: ", contract);
            contractArtifact = contract;
            this.log.d("Contract Address: ", this.contractAddress);
            this.log.d("Public Address: ", this.currentUser.address);
            return contractArtifact.methods.getNumberUserCommits().call();
        }).then(numberOfCommits => {
            let promises = new Array<Promise<string>>();
            for (let i = 0; i < numberOfCommits; i++) {
                let promise = contractArtifact.methods.getUserCommits(i).call();
                promises.push(promise);
            }
            return Promise.all(promises);
        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
    }

    public getAllUserEmail(): Promise<string[] | void> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return contractArtifact.methods.getAllUserNumber().call();
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
                throw err;
            });
    }

    public getCommitsToReview(): Promise<any> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return contractArtifact.methods.getNumberCommitsToReviewByMe().call();
        }).then(numberOfCommits => {
            this.log.d("NumberuserCommits: ", numberOfCommits);
            let promises = new Array<Promise<string>>();
            for (let i = 0; i < numberOfCommits; i++) {
                let promise = contractArtifact.methods.getCommitsToReviewByMe(i).call();
                promises.push(promise);
            }
            return Promise.all(promises);

        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
    }
    public getDetailsCommits(id: string): Promise<CommitDetails> {
        return this.initProm.then(contractArtifact => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return contractArtifact.methods.getDetailsCommits(id).call();
        }).then((commitVals: Array<any>) => {
            return CommitDetails.fromSmartContract(commitVals);
        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
    }

    public setReview(index: number, text: string, points: number): Promise<any> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            let bytecodeData = contractArtifact.methods.setReview(index, text, points).encodeABI();
            this.log.d("Introduced index: ", index);
            this.log.d("Introduced text: ", text);
            this.log.d("Introduced points: ", points);
            this.log.d("DATA: ", bytecodeData);

            return this.sendTx(bytecodeData);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });

    }
    public getCommentsOfCommit(index: number): Promise<CommitComments[]> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return contractArtifact.methods.getNumberComments(index).call();
        }).then((numberComments: number) => {
            this.log.d("Number of comments: ", numberComments);
            let promises = new Array<Promise<CommitComments>>();
            for (let i = 0; i < numberComments; i++) {
                let promise = contractArtifact.methods.getCommentsOfCommit(index, i).call()
                    .then((commentVals: Array<any>) => {
                        return CommitComments.fromSmartContract(commentVals);
                    });
                promises.push(promise);
            }
            return Promise.all(promises);

        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
    }
    public getUserDetails(hash: string): Promise<UserDetails> {
        return this.initProm.then(contract => {
            let contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return contractArtifact.methods.getUser(hash).call();
        }).then((userVals: Array<any>) => {
            return UserDetails.fromSmartContract(userVals);
        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
    }
    public setThumbReviewForComment(id: string, index: number, value: number): Promise<any> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            let bytecodeData = contractArtifact.methods.setVote(id, index, value).encodeABI();
            this.log.d("Introduced index: ", index);
            this.log.d("Introduced value: ", value);
            this.log.d("DATA: ", bytecodeData);

            return this.sendTx(bytecodeData);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
    }
    public reviewChangesCommitFlag(id: string) {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            let bytecodeData = contractArtifact.methods.readComments(id).encodeABI();
            this.log.d("Introduced id: ", id);
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
    }
    private sendTx(bytecodeData): Promise<void | TransactionReceipt> { //PromiEvent<TransactionReceipt>
        return this.web3.eth.getTransactionCount(this.currentUser.address)
            .then(nonceValue => {
                let nonce = "0x" + (nonceValue).toString(16);
                this.log.d("Value NONCE", nonce);
                let rawtx = {
                    nonce: nonce,
                    // I could use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                    gasPrice: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG.gasPrice),
                    gasLimit: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG.gasLimit),
                    to: this.contractAddress,
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
                return this.web3.eth.sendSignedTransaction(raw);
            }).then(transactionHash => {
                this.log.d("Hash transaction", transactionHash);
                return transactionHash;
            }).catch(e => {
                this.log.e("Error in transaction (sendTx function): ", e);
                throw e;
            });

    }
}

