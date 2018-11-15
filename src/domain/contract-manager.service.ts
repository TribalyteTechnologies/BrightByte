import { Injectable } from "@angular/core";
import { default as Web3 } from "web3";
import { Web3Service } from "../core/web3.service";
import { ILogger, LoggerService } from "../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { default as TruffleContract } from "truffle-contract";
import { AppConfig } from "../app.config";
import Tx from "ethereumjs-tx";
import { TransactionReceipt, Account } from "web3/types";
import { CommitDetails } from "../models/commit-details.model";
import { UserDetails } from "../models/user-details.model";
import { CommitComment } from "../models/commit-comment.model";
import { UserCommit } from "../models/user-commit.model";
import { UserReputation } from "../models/user-reputation.model";

interface ItrbSmartContractJson {
    abi: Array<any>;
}

interface ItrbSmartContact { //Web3.Eth.Contract
    [key: string]: any;
}

@Injectable()
export class ContractManagerService {
    private contractAddressRoot: string;
    private contractAddressBright: string;
    private contractAddressCommits: string;
    private log: ILogger;
    private web3: Web3;
    private initProm: Promise<Array<ItrbSmartContact>>;
    private currentUser: Account;

    constructor(
        public http: HttpClient,

        web3Service: Web3Service,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ContractManagerService");
        this.web3 = web3Service.getWeb3();
    }

    public init(user: Account): Promise<ItrbSmartContact> {
        this.currentUser = user;
        this.log.d("Initializing service with user ", this.currentUser);
        let contractPromises = new Array<Promise<ItrbSmartContact>>();
        let promBright = this.http.get("../assets/build/Bright.json").toPromise()
        .then((jsonContractData: ItrbSmartContractJson) => {
            let truffleContractBright = TruffleContract(jsonContractData);
            this.contractAddressBright = truffleContractBright.networks[AppConfig.NETWORK_CONFIG.netId].address;
            let contractBright = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressBright, {
                from: this.currentUser.address,
                gas: AppConfig.NETWORK_CONFIG.gasLimit,
                gasPrice: AppConfig.NETWORK_CONFIG.gasPrice,
                data: truffleContractBright.deployedBytecode
            });
            this.log.d("TruffleContractBright function: ", contractBright);
            this.log.d("ContractAddressBright: ", this.contractAddressBright);
            return contractBright;
        });
        contractPromises.push(promBright);
        let promCommits = this.http.get("../assets/build/Commits.json").toPromise()
        .then((jsonContractData: ItrbSmartContractJson) => {
            let truffleContractCommits = TruffleContract(jsonContractData);
            this.contractAddressCommits = truffleContractCommits.networks[AppConfig.NETWORK_CONFIG.netId].address;
            let contractCommits = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressCommits, {
                from: this.currentUser.address,
                gas: AppConfig.NETWORK_CONFIG.gasLimit,
                gasPrice: AppConfig.NETWORK_CONFIG.gasPrice,
                data: truffleContractCommits.deployedBytecode
            });
            this.log.d("TruffleContractBright function: ", contractCommits);
            this.log.d("ContractAddressCommits: ", this.contractAddressCommits);
            return contractCommits;
        });
        contractPromises.push(promCommits);
        let promRoot = this.http.get("../assets/build/Root.json").toPromise()
        .then((jsonContractData: ItrbSmartContractJson) => {
            let truffleContractRoot = TruffleContract(jsonContractData);
            this.contractAddressRoot = truffleContractRoot.networks[AppConfig.NETWORK_CONFIG.netId].address;
            let contractRoot = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressRoot, {
                from: this.currentUser.address,
                gas: AppConfig.NETWORK_CONFIG.gasLimit,
                gasPrice: AppConfig.NETWORK_CONFIG.gasPrice,
                data: truffleContractRoot.deployedBytecode
            });
            this.log.d("TruffleContractBright function: ", contractRoot);
            this.log.d("ContractAddressRoot: ", this.contractAddressRoot);
            return contractRoot;
        });
        contractPromises.push(promRoot);
        return this.initProm = Promise.all(contractPromises);
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
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Contract: ", bright);
            contractArtifact = bright;
            this.log.d("Setting profile with name and mail: ", [name, mail]);
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            let bytecodeData = contractArtifact.methods.setProfile(name, mail).encodeABI();
            this.log.d("Bytecode data: ", bytecodeData);

            return this.sendTx(bytecodeData, this.contractAddressBright);

        }).catch(e => {
            this.log.e("Error setting profile: ", e);
            throw e;
        });
    }
    public addCommit(url: string, title: string, usersMail: string[]): Promise<any> {
        let rootContract;
        return this.initProm.then(([bright, commit, root]) => {
            rootContract = root;
            this.log.d("Contract artifact: ", commit);
            this.log.d("Contract Address: ", this.contractAddressCommits);
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Variables: url ", url);
            this.log.d("UsersMail: ", usersMail);
            // let project = this.splitService.getProject(url);
            let numUsers: number = 0;
            for(let i: number = 0; i < usersMail.length; i++){
                if(usersMail[i] !== ""){
                    numUsers ++;
                }
            }
            let bytecodeData = commit.methods.setNewCommit(
                title,
                url,
                numUsers
            ).encodeABI();
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressCommits);
        }).then(() => {
            let emailsArray;
            emailsArray = [];
            for(let i = 0; i < usersMail.length; i++){
                //let emailHash = this.web3.utils.keccak256(usersMail[i]);
                //emailsArray.push(emailHash || "0x00");
                if (usersMail[i] !== ""){
                    emailsArray.push(this.web3.utils.keccak256(usersMail[i]));
                }
            }    
            let bytecodeData = rootContract.methods.notifyCommit(
                url,
                emailsArray
            ).encodeABI();
            this.log.d("ByteCodeData of notifyCommit: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressRoot);
        }).catch(e => {
            this.log.e("Error in addcommit: ", e);
            throw e;
        });
    }
     public getCommits(): Promise<Array<Array<UserCommit>>> {
        let allUserCommits: Array<any>;
        let promisesPending = new Array<Promise<UserCommit>>();
        let promisesFinished = new Array<Promise<UserCommit>>();
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", bright);
            return bright.methods.getUserCommits(this.currentUser.address).call();
        }).then((allUserCommitsRes: Array<any>) => {
            allUserCommits = allUserCommitsRes;
            return this.initProm;
        }).then(([brigh, commit, root]) => {
            for(let i = 0; i < allUserCommits[2].length; i++){
                let promisePending: Promise<UserCommit> = commit.methods.getDetailsCommits(allUserCommits[2][i]).call()
                .then((commitVals: any) => UserCommit.fromSmartContract(commitVals, true));
                promisesPending.push(promisePending);
            }
            for(let i = 0; i < allUserCommits[3].length; i++){
                let promiseFinished: Promise<UserCommit> = commit.methods.getDetailsCommits(allUserCommits[3][i]).call()
                .then((commitVals: any) => UserCommit.fromSmartContract(commitVals, false));
                promisesFinished.push(promiseFinished);
            }
            return Promise.all([Promise.all(promisesPending), Promise.all(promisesFinished)]);
        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
     }

    public getCommitsToReview(): Promise<UserCommit[][]> {
        return this.initProm
        .then(([bright, commit, root]) => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", bright);
            return bright.methods.getUserCommits(this.currentUser.address).call()
                .then((allUserCommits: Array<any>) => {
                    let promisesPending = new Array<Promise<UserCommit>>();
                    let promisesFinished = new Array<Promise<UserCommit>>();
                    return this.initProm.then(([brightC, commitment, rootC]) => {
                        for(let i = 0 ; i < allUserCommits[0].length; i++){
                            let promisePending = commitment.methods.getDetailsCommits(allUserCommits[0][i]).call()
                            .then((commitVals: any) => {
                                return UserCommit.fromSmartContract(commitVals, true);
                            });
                            promisesPending.push(promisePending);
                        }
                        for(let i = 0 ; i < allUserCommits[1].length; i++){
                            let promiseFinished = commitment.methods.getDetailsCommits(allUserCommits[1][i]).call()
                            .then((commitVals: any) => {
                                return UserCommit.fromSmartContract(commitVals, false);
                            });
                            promisesFinished.push(promiseFinished);
                        }
                        return Promise.all([Promise.all(promisesPending), Promise.all(promisesFinished)]);
                    });
                });
        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
    }
    
    public getDetailsCommits(url: string): Promise<CommitDetails> {
        return this.initProm.then(([bright, commit, root]) => {
            return commit.methods.getDetailsCommits(this.web3.utils.keccak256(url)).call()
            .then((commitVals: any) => {
                return CommitDetails.fromSmartContract(commitVals);
            });
        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
    }

    public setReview(url: string, text: string, points: number): Promise<any> {
        return this.initProm.then(([bright, commit, root]) => {
            let contractArtifact = commit;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            let bytecodeData = contractArtifact.methods.setReview(url, text, points).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("Introduced text: ", text);
            this.log.d("Introduced points: ", points);
            this.log.d("DATA: ", bytecodeData);

            return this.sendTx(bytecodeData, this.contractAddressCommits);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });

    }
    public getCommentsOfCommit(url: string): Promise<CommitComment[][]> {
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", commit);
            let url_byte = this.web3.utils.keccak256(url);
            return commit.methods.getCommentsOfCommit(url_byte).call()
                .then((allComments: Array<any>) => {
                    let promisesPending = new Array<Promise<CommitComment>>();
                    let promisesFinished = new Array<Promise<CommitComment>>();
                    for(let i = 0; i < allComments[0].length; i++){
                        let promisePending = commit.methods.getCommentDetail(url_byte, allComments[0][i]).call()
                        .then((commitVals: any) => {
                            return CommitComment.fromSmartContract(commitVals, "");
                        });
                        promisesPending.push(promisePending);
                    }
                    for(let i = 0 ; i < allComments[1].length; i++){
                        let promiseFinished = commit.methods.getCommentDetail(url_byte, allComments[1][i]).call()
                        .then((commitVals: any) => {
                            return bright.methods.getUserName(commitVals[5]).call()
                            .then((userName) => {
                                return CommitComment.fromSmartContract(commitVals, userName);
                            });
                        });
                        promisesFinished.push(promiseFinished);
                    }
                    return Promise.all([Promise.all(promisesPending), Promise.all(promisesFinished)]);
                    });
        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
    }
    
    public getUserDetails(hash: string): Promise<UserDetails> {
        return this.initProm.then(([bright, commit, root]) => {
            let contractArtifact = bright;
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
        return this.initProm.then(([bright, commit, root]) => {
            contractArtifact = root;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            return this.getCommentsOfCommit(url)
            .then((arrayOfComments: CommitComment[][]) => {
                let bytecodeData = contractArtifact.methods.setVote(url, arrayOfComments[1][index].user, value).encodeABI();
                this.log.d("Introduced index: ", index);
                this.log.d("Introduced value: ", value);
                this.log.d("DATA: ", bytecodeData);
                return this.sendTx(bytecodeData, this.contractAddressRoot);
            });
        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
    }
    
    public reviewChangesCommitFlag(url: string) {
        let contractArtifact;
        return this.initProm.then(([bright, commit, root]) => {
            contractArtifact = root;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            let bytecodeData = contractArtifact.methods.readCommit(url).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressRoot);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
    }
    
    public getAllUserReputation(): Promise<UserReputation[]> {
        let contractArtifact;
        return this.initProm.then(([bright, commit, root]) => {
            contractArtifact = bright;
            return contractArtifact.methods.getNumbers().call();
        }).then((numberUsers: number) => {
            this.log.d("Number of users: ", numberUsers);
            let promises = new Array<Promise<UserReputation>>();
            for (let i = 0; i < numberUsers; i++) {
                let promise = contractArtifact.methods.getAllUserReputation(i).call()
                .then((commitsVals: Array<any>) => {
                    this.log.d("User reputation: ", commitsVals);
                    return UserReputation.fromSmartContract(commitsVals);
                });
                promises.push(promise);
            }
            return Promise.all(promises);
        }).catch(err => {
                this.log.e("Error getting ranking :", err);
                throw err;
            });
    }
    public getFeedback(url): Promise<boolean> {
         let contractArtifact;
         let url_byte = this.web3.utils.keccak256(url);
         return this.initProm.then(contract => {
             contractArtifact = contract;
             let promise = contractArtifact[0].methods.getFeedback(url_byte).call();
             return promise;
         }).catch(err => {
             this.log.e("Error getting urls (Feedback) :", err);
             throw err;
         });
    }
    public setFeedback(url: string){
        let contractArtifact;
        return this.initProm.then(([bright, commit, root]) => {
            contractArtifact = root;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            let bytecodeData = contractArtifact.methods.setFeedback(url, this.currentUser.address).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressRoot);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
   }
    private sendTx(bytecodeData, contractAddress): Promise<void | TransactionReceipt> { //PromiEvent<TransactionReceipt>
        return this.web3.eth.getTransactionCount(this.currentUser.address, "pending")
            .then(nonceValue => {
                let nonce = "0x" + (nonceValue).toString(16);
                this.log.d("Value NONCE", nonce);
                let gasPrice = AppConfig.NETWORK_CONFIG.gasPrice;
                let gasLimit = AppConfig.NETWORK_CONFIG.gasLimit;
                let rawtx = {
                    nonce: nonce,
                    // I could use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                    gasPrice: this.web3.utils.toHex(gasPrice),
                    gasLimit: this.web3.utils.toHex(gasLimit),
                    to: contractAddress,
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

