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
import { CommitComment } from "../models/commit-comment.model";
import { UserCommit } from "../models/user-commit.model";
import { CommitToReview } from "../models/commit-to-review.model";
import { UserReputation } from "../models/user-reputation.model";

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

        private splitService: SplitService,
        web3Service: Web3Service,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ContractManagerService");
        this.web3 = web3Service.getWeb3();
    }

    public init(user: Account): Promise<ItrbSmartContact> {
        this.currentUser = user;
        this.log.d("Initializing service with user ", this.currentUser);
        this.initProm = this.http.get("assets/build/Bright.json").toPromise()
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
    
    public addCommit(url: string, title: string, usersMail: Array<string>): Promise<any> {
        let fnArgs = arguments;
        let contractArtifact;
        return this.initProm.then(contract => {
            this.log.d("Adding commit. Contract artifact: ", contract);
            contractArtifact = contract;
            this.log.d("Contract Address: ", this.contractAddress);
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Arguments: ", fnArgs);
            let project = this.splitService.getProject(url);
            let bytecodeData = contractArtifact.methods.setNewCommit(
                title,
                url,
                project,
                usersMail[0] || "",
                usersMail[1] || "",
                usersMail[2] || "",
                usersMail[3] || ""
            ).encodeABI();
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData);
        }).catch(e => {
            this.log.e("Error in addcommit: ", e);
            throw e;
        });
    }
    
    public getCommits(): Promise<UserCommit[]> {
        let contractArtifact;
        return this.initProm.then(contract => {
            this.log.d("Contract artifact: ", contract);
            contractArtifact = contract;
            this.log.d("Contract Address: ", this.contractAddress);
            this.log.d("Public Address: ", this.currentUser.address);
            return contractArtifact.methods.getNumbers().call();
        }).then((numberOfCommits: number[]) => {
            let promises = new Array<Promise<UserCommit>>();
            for (let i = 0; i < numberOfCommits[0]; i++) {
                let promise = contractArtifact.methods.getUserCommits(i).call()
                .then((commitsVals: Array<any>) => {
                    return UserCommit.fromSmartContract(commitsVals);
                });
                promises.push(promise);
            }
            return Promise.all(promises);
        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
    }

    public getCommitsToReview(): Promise<CommitToReview[]> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return contractArtifact.methods.getNumbers().call();
        }).then((numberOfCommits: number[]) => {
            this.log.d("NumberuserCommits: ", numberOfCommits);
            let promises = new Array<Promise<CommitToReview>>();
            for (let i = 0; i < numberOfCommits[2]; i++) {
                let promise = contractArtifact.methods.getCommitsToReviewByMe(i).call()
                .then((commitsVals: Array<any>) => {
                    return CommitToReview.fromSmartContract(commitsVals);
                });
                promises.push(promise);
            }
            return Promise.all(promises);

        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
    }
    
    public getDetailsCommits(url: string): Promise<CommitDetails> {
        return this.initProm.then(contractArtifact => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return contractArtifact.methods.getDetailsCommits(url).call();
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
    
    public getCommentsOfCommit(url: string): Promise<CommitComment[]> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return contractArtifact.methods.getNumbersNeedUrl(url).call();
        }).then((numberComments: number[]) => {
            this.log.d("Number of comments: ", numberComments);
            let promises = new Array<Promise<CommitComment>>();
            for (let i = 0; i < numberComments[0]; i++) {
                let promise = contractArtifact.methods.getCommentsOfCommit(url, i).call()
                    .then((commentVals: Array<any>) => {
                        return CommitComment.fromSmartContract(commentVals);
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
    
    public setThumbReviewForComment(url: string, index: number, value: number): Promise<any> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            let bytecodeData = contractArtifact.methods.setVote(url, index, value).encodeABI();
            this.log.d("Introduced index: ", index);
            this.log.d("Introduced value: ", value);
            this.log.d("DATA: ", bytecodeData);

            return this.sendTx(bytecodeData);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
    }
    
    public reviewChangesCommitFlag(url: string) {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            let bytecodeData = contractArtifact.methods.readComments(url).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
    }
    
    public getAllUserReputation(): Promise<UserReputation[]> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            return contractArtifact.methods.getNumbers().call();
        }).then((numberUsers: number[]) => {
            let promises = new Array<Promise<UserReputation>>();
            for (let i = 0; i < numberUsers[1]; i++) {
                let promise = contractArtifact.methods.getAllUserReputation(i).call()
                .then((commitsVals: Array<any>) => {
                    return UserReputation.fromSmartContract(commitsVals);
                });
                promises.push(promise);
            }
            return Promise.all(promises);
        })

            .catch(err => {
                this.log.e("Error getting ranking :", err);
                throw err;
            });
    }
    
    public getFeedback(url): Promise<boolean[]> {
        let contractArtifact;
        return this.initProm.then(contract => {
            contractArtifact = contract;
            return contractArtifact.methods.getNumbersNeedUrl(url).call();
        }).then((numberUsers: number[]) => {
            let promises = new Array<Promise<boolean>>();
            for (let i = 0; i < numberUsers[1]; i++) {
                let promise = contractArtifact.methods.isFeedback(i, url).call();
                promises.push(promise);
            }
            return Promise.all(promises);
        }).catch(err => {
            this.log.e("Error getting urls (Feedback) :", err);
            throw err;
        });
    }
    
    private sendTx(bytecodeData): Promise<void | TransactionReceipt> { //PromiEvent<TransactionReceipt>
        return this.web3.eth.getTransactionCount(this.currentUser.address, "pending")
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
                this.log.d("Priv is 0x: ", priv);
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

