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
    private contractAddressRootOld: string;
    private contractAddressBrightOld: string;
    private contractAddressCommitsOld: string;
    private log: ILogger;
    private web3: Web3;
    private initProm: Promise<Array<ItrbSmartContact>>;
    private initPromOld: Promise<Array<ItrbSmartContact>>;
    private currentUser: Account;
    

    constructor(
        private http: HttpClient,
        private web3Service: Web3Service,
        private loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ContractManagerService");
        this.web3 = web3Service.getWeb3();
        this.web3Service = web3Service;
    }

    public init(user: Account, cont: number): Promise<any> {
        AppConfig.CURRENT_NODE_INDEX = cont;
        let configNet = AppConfig.NETWORK_CONFIG[cont];
        this.web3Service = new Web3Service(this.loggerSrv);
        this.web3 = this.web3Service.getWeb3();
        this.log.d("Initializing with URL: " + configNet.urlNode);
        this.currentUser = user;
        this.log.d("Initializing service with user ", this.currentUser);
        let contractPromises = new Array<Promise<ItrbSmartContact>>();
        let promBright = this.http.get("../assets/build/Bright.json").toPromise()
            .then((jsonContractData: ItrbSmartContractJson) => {
                let truffleContractBright = TruffleContract(jsonContractData);
                this.contractAddressBright = truffleContractBright.networks[configNet.netId].address;
                let contractBright = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressBright, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
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
                this.contractAddressCommits = truffleContractCommits.networks[configNet.netId].address;
                let contractCommits = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressCommits, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
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
                this.contractAddressRoot = truffleContractRoot.networks[configNet.netId].address;
                let contractRoot = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressRoot, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
                    data: truffleContractRoot.deployedBytecode
                });
                this.log.d("TruffleContractBright function: ", contractRoot);
                this.log.d("ContractAddressRoot: ", this.contractAddressRoot);
                return contractRoot;
            });
        contractPromises.push(promRoot);
        this.initOld(this.currentUser, 0);
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
            for (let i: number = 0; i < usersMail.length; i++) {
                if (usersMail[i] !== "") {
                    numUsers++;
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
            let emailsArray = [];
            for (let i = 0; i < usersMail.length; i++) {
                if (usersMail[i] !== "") {
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
            for (let i = 0; i < allUserCommits[2].length; i++) {
                let promisePending: Promise<UserCommit> = commit.methods.getDetailsCommits(allUserCommits[2][i]).call()
                    .then((commitVals: any) => UserCommit.fromSmartContract(commitVals, true));
                promisesPending.push(promisePending);
            }
            for (let i = 0; i < allUserCommits[3].length; i++) {
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
            .then(([bright, commit]) => {
                this.log.d("Public Address: ", this.currentUser.address);
                this.log.d("Contract artifact", bright);
                return bright.methods.getUserCommits(this.currentUser.address).call()
                    .then((allUserCommits: Array<any>) => {
                        let promisesPending = new Array<Promise<UserCommit>>();
                        let promisesFinished = new Array<Promise<UserCommit>>();
                        for (let i = 0; i < allUserCommits[0].length; i++) {
                            let promisePending = commit.methods.getDetailsCommits(allUserCommits[0][i]).call()
                                .then((commitVals: any) => {
                                    return UserCommit.fromSmartContract(commitVals, true);
                                });
                            promisesPending.push(promisePending);
                        }
                        for (let i = 0; i < allUserCommits[1].length; i++) {
                            let promiseFinished = commit.methods.getDetailsCommits(allUserCommits[1][i]).call()
                                .then((commitVals: any) => {
                                    return UserCommit.fromSmartContract(commitVals, false);
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
            let urlKeccak = this.web3.utils.keccak256(url);
            return commit.methods.getCommentsOfCommit(urlKeccak).call()
                .then((allComments: Array<any>) => {
                    let promisesPending = new Array<Promise<CommitComment>>();
                    let promisesFinished = new Array<Promise<CommitComment>>();
                    for (let i = 0; i < allComments[0].length; i++) {
                        let promisePending = commit.methods.getCommentDetail(urlKeccak, allComments[0][i]).call()
                            .then((commitVals: any) => {
                                return CommitComment.fromSmartContract(commitVals, "");
                            });
                        promisesPending.push(promisePending);
                    }
                    for (let i = 0; i < allComments[1].length; i++) {
                        let promiseFinished = commit.methods.getCommentDetail(urlKeccak, allComments[1][i]).call()
                            .then((commitVals: any) => {
                                return Promise.all([commitVals, bright.methods.getUserName(commitVals[5]).call()]);
                            })
                            .then((data) => {
                                return CommitComment.fromSmartContract(data[0], data[1]);
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
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", bright);
            return bright.methods.getUser(hash).call();
        }).then((userVals: Array<any>) => {
            return UserDetails.fromSmartContract(userVals);
        }).catch(err => {
            this.log.e("Error calling BrightByte smart contract :", err);
            throw err;
        });
    }

    public setThumbReviewForComment(url: string, index: number, value: number): Promise<any> {
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", root);
            return this.getCommentsOfCommit(url)
                .then((arrayOfComments: CommitComment[][]) => {
                    let bytecodeData = root.methods.setVote(url, arrayOfComments[1][index].user, value).encodeABI();
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
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", root);
            let bytecodeData = root.methods.readCommit(url).encodeABI();
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

    public getAllUserReputationSeason(season: number, global: boolean): Promise<UserReputation[]> {
        let contractArtifact;
        return this.initProm.then(([bright, commit, root]) => {
            contractArtifact = bright;
            return contractArtifact.methods.getNumbers().call();
        }).then((numberUsers: number) => {
            this.log.d("Number of users: ", numberUsers);
            let promises = new Array<Promise<UserReputation>>();
            for (let i = 0; i < numberUsers; i++) {
                let promise: Promise<UserReputation>;
                if(global) {
                    promise = contractArtifact.methods.getAllUserReputation(i).call()
                    .then((commitsVals: Array<any>) => {
                        this.log.d("User reputation: ", commitsVals);
                        return UserReputation.fromSmartContract(commitsVals);
                    });
                } else {
                    promise = contractArtifact.methods.getUserReputation(i, season).call()
                    .then((commitsVals: Array<any>) => {
                        this.log.d("Users reputation in season " + season + ": ", commitsVals);
                        return UserReputation.fromSmartContract(commitsVals);
                    });
                }
                promises.push(promise);
            }
            return Promise.all(promises);
        }).catch(err => {
            this.log.e("Error getting ranking :", err);
            throw err;
        });
    }

    public getCurrentSeason(): Promise<number[]> {
        let contractArtifact;
        return this.initProm.then(([bright, commit, root]) => {
            contractArtifact = bright;
            return contractArtifact.methods.getCurrentSeason().call();
        });
    }
    
    public getFeedback(url): Promise<boolean> {
        let urlKeccak = this.web3.utils.keccak256(url);
        return this.initProm.then(contract => {
            let promise = contract[0].methods.getFeedback(urlKeccak).call();
            return promise;
        }).catch(err => {
            this.log.e("Error getting urls (Feedback) :", err);
            throw err;
        });
    }

    public setFeedback(url: string) {
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", root);
            let bytecodeData = root.methods.setFeedback(url, this.currentUser.address).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressRoot);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
    }

    public getReviewers(url: string): Promise<string[][]> {
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Adress: ", this.currentUser.address);
            let urlKeccak = this.web3.utils.keccak256(url);
            return commit.methods.getCommentsOfCommit(urlKeccak).call();
        });
    }

    public getReviewersName(url: string): Promise<UserDetails[][]> {
        return this.getReviewers(url).then(rsp => {
            
            let userPending = rsp[0].map((usr) => {
                return this.getUserDetails(usr);
            });
            let userFinished = rsp[1].map((usr) => {
                return this.getUserDetails(usr);
            });
            let userPromise = [userPending, userFinished];
            return Promise.all(userPromise.map(UsrPro => {
                return Promise.all(UsrPro);
                })
            );
        });
    }

     //////////////////////OPTIONAL MIGRATION FROM v0.2.1 TO v0.3.0//////////////////////////////////

     public initOld(user: Account, cont: number): Promise<any> {
        AppConfig.CURRENT_NODE_INDEX = cont;
        let configNet = AppConfig.NETWORK_CONFIG[cont];
        this.web3Service = new Web3Service(this.loggerSrv);
        this.web3 = this.web3Service.getWeb3();
        this.log.d("Initializing with URL: " + configNet.urlNode);
        this.currentUser = user;
        this.log.d("Initializing service with user ", this.currentUser);
        let contractPromises = new Array<Promise<ItrbSmartContact>>();
        let promBright = this.http.get("../assets/build/BrightOld.json").toPromise()
            .then((jsonContractData: ItrbSmartContractJson) => {
                let truffleContractBright = TruffleContract(jsonContractData);
                this.contractAddressBrightOld = truffleContractBright.networks[configNet.netId].address;
                let contractBright = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressBrightOld, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
                    data: truffleContractBright.deployedBytecode
                });
                this.log.d("TruffleContractBright function: ", contractBright);
                this.log.d("ContractAddressBright: ", this.contractAddressBrightOld);
                return contractBright;
            });
        contractPromises.push(promBright);
        let promCommits = this.http.get("../assets/build/CommitsOld.json").toPromise()
            .then((jsonContractData: ItrbSmartContractJson) => {
                let truffleContractCommits = TruffleContract(jsonContractData);
                this.contractAddressCommitsOld = truffleContractCommits.networks[configNet.netId].address;
                let contractCommits = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressCommitsOld, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
                    data: truffleContractCommits.deployedBytecode
                });
                this.log.d("TruffleContractBright function: ", contractCommits);
                this.log.d("ContractAddressCommits: ", this.contractAddressCommitsOld);
                return contractCommits;
            });
        contractPromises.push(promCommits);
        let promRoot = this.http.get("../assets/build/RootOld.json").toPromise()
            .then((jsonContractData: ItrbSmartContractJson) => {
                let truffleContractRoot = TruffleContract(jsonContractData);
                this.contractAddressRootOld = truffleContractRoot.networks[configNet.netId].address;
                let contractRoot = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressRootOld, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
                    data: truffleContractRoot.deployedBytecode
                });
                this.log.d("TruffleContractBright function: ", contractRoot);
                this.log.d("ContractAddressRoot: ", this.contractAddressRootOld);
                return contractRoot;
            });
        contractPromises.push(promRoot);
        return this.initPromOld = Promise.all(contractPromises);
    }


    public getUserMigration(){

        let brightOld;
        let commitOld;
        let rootOld;

        let brightNew;
        let commitNew;
        let rootNew;

        let usersHash = [];
        let users = [];

        return this.initPromOld
        .then(([bright, commit, root]) => {
            brightOld = bright;
            commitOld = commit;
            rootOld = root;
            return this.initProm;
        }).then(([bright, commit, root]) => {
            brightNew = bright;
            commitNew = commit;
            rootNew = root;
            
            return brightOld.methods.getNumbers().call();
        }).then(userNumber => {

            let promises = new Array<Promise<any>>();

            for(let i = 0; i < userNumber; i++){
                let promise = brightOld.methods.getAllUserEmail(i).call();
                promises.push(promise);
            }
            return Promise.all(promises);
        }).then(emails => {
            let promises = new Array<Promise<any>>();

            for(let i = 0; i < emails.length; i++){
                let promise = brightOld.methods.getAddressByEmail(this.web3.utils.keccak256(emails[i])).call();
                promises.push(promise);
            }
            return Promise.all(promises);
        }).then(addr => {
            let promises = new Array<Promise<any>>();
            usersHash = addr;
            for(let i = 0; i < addr.length; i++){
                let promise = brightOld.methods.getUser(addr[i]).call();
                promises.push(promise);
            }
            return Promise.all(promises);
        }).then(userInfo => {

            for(let i = 0; i < userInfo.length; i++){
                let user = new User();
                user.name = userInfo[i][0];
                user.email = userInfo[i][1];
                user.reputation = userInfo[i][6];
                user.agreedPercentage = userInfo[i][7];
                user.hash = usersHash[i];
                users.push(user);
            }

            let promises = new Array<Promise<any>>();

            for(let i = 0; i < usersHash.length; i++){
                let promise = brightOld.methods.getUserCommits(usersHash[i]).call();
                promises.push(promise);
            }
            return Promise.all(promises);

        }).then(userCommits => {
            for(let i = 0; i < userCommits.length; i++){
                users[i].pendingReviews = userCommits[i][0];
                users[i].finishedReviews = userCommits[i][1];
                users[i].pendingCommits = userCommits[i][2];
                users[i].finishedCommits = userCommits[i][3];
            }

            let promises = new Array<Promise<any>>();

            for(let i = 0; i < usersHash.length; i++){
                let promise = brightOld.methods.getToRead(usersHash[i]).call();
                promises.push(promise);
            }
            return Promise.all(promises);

        }).then(userToRead => {
            for(let i = 0; i < userToRead.length; i++){
                users[i].toRead = userToRead[i];

            }

            let promises = new Array<Promise<any>>();

            for(let i = 0; i < usersHash.length; i++){
                let promise = brightOld.methods.getVotes(usersHash[i]).call();
                promises.push(promise);
            }
            return Promise.all(promises);

        }).then(userVotes => {
            for(let i = 0; i < userVotes.length; i++){
                users[i].positiveVotes = userVotes[i][0];
                users[i].negativeVotes = userVotes[i][1];
            }

            let promises = new Array<Promise<any>>();

            for(let i = 0; i < usersHash.length; i++){
                let promise = brightOld.methods.getAllUserReputation(i).call();
                promises.push(promise);
            }
            return Promise.all(promises);

        }).then(reputation => {
            for(let i = 0; i < usersHash.length; i++){
                for(let j = 0; j < reputation.length; j++){
                    if(usersHash[i] === reputation[j][8]){
                        users[i].reputation = reputation[i][1];
                        users[i].numberOfTimesReview = reputation[i][2];
                        users[i].numberOfPoints = reputation[i][3];
                    }
                }
            }

            
            for(let i = 0; i < users.length; i++){
                if(users[i].email === "jsainz@tribalyte.com" || users[i].email === "s@s.com" ){
                    users.splice(i, 1);
                    i--;
                }
            }

            this.log.d("Users: " + users);

            return users.reduce(
                (prevVal, user) => {
                    return prevVal.then(() => {
                        let byteCodeData = brightNew
                        .methods
                        .setAllUserData(
                            user.name, 
                            user.email, 
                            user.hash, 
                            user.agreedPercentage, user.numberOfPoints, 
                            user.numberOfTimesReview, user.positiveVotes, 
                            user.negativeVotes, user.reputation).encodeABI();
                        return this.sendTx(byteCodeData, this.contractAddressBright);
                    });
                }, 
                Promise.resolve()
            );

        }).then(trxResponse => { 
            return users.reduce(
                (prevVal, user) => {
                    return prevVal.then(() => {
                        let byteCodeData = brightNew
                        .methods
                        .setAllUserDataTwo(
                            user.hash, 
                            [], 
                            user.pendingCommits, 
                            user.finishedReviews,
                            user.pendingReviews, 
                            user.toRead).encodeABI();
                        return this.sendTx(byteCodeData, this.contractAddressBright);
                    });
                }, 
                Promise.resolve()
            );
        }).then(trx => {
            this.log.w(this.web3.eth.accounts);
            let byteCodeData = 
            rootNew.
            methods.
            changeContractAddress(
            this.contractAddressBright, this.contractAddressCommitsOld).encodeABI();
            return this.sendTxOwner(byteCodeData, this.contractAddressRoot);
        }).then(trx => {
            let byteCodeData = 
            commitOld.
            methods.
            setRootAddress(
            this.contractAddressRoot).encodeABI();
            return this.sendTxOwner(byteCodeData, this.contractAddressCommitsOld);
        });

    }

    private sendTx(bytecodeData, contractAddress): Promise<void | TransactionReceipt> { //PromiEvent<TransactionReceipt>
        return this.web3.eth.getTransactionCount(this.currentUser.address, "pending")
            .then(nonceValue => {
                let nonce = "0x" + (nonceValue).toString(16);
                this.log.d("Value NONCE", nonce);
                let rawtx = {
                    nonce: nonce,
                    // I could use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                    gasPrice: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX].gasPrice),
                    gasLimit: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX].gasLimit),
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

    private sendTxOwner(bytecodeData, contractAddress): Promise<void | TransactionReceipt> { //PromiEvent<TransactionReceipt>
        const NODE_PUBLIC_ADDR = "0x";
        const NODE_PRIVATE_ADDR = "0x";
        return this.web3.eth.getTransactionCount(NODE_PUBLIC_ADDR, "pending")    //Change the address to the public address of the deployer
            .then(nonceValue => {
                let nonce = "0x" + (nonceValue).toString(16);
                this.log.d("Value NONCE", nonce);
                let rawtx = {
                    nonce: nonce,
                    // I could use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                    gasPrice: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX].gasPrice),
                    gasLimit: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX].gasLimit),
                    to: contractAddress,
                    data: bytecodeData
                };
                const tx = new Tx(rawtx);
                let priv = NODE_PRIVATE_ADDR;    //Change the address to the private address of the deployer
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

class User{
    public name: string;
    public email: string;
    public hash;
    public finishedCommits = [];
    public pendingCommits = [];
    public finishedReviews = [];
    public pendingReviews = [];
    public reputation;
    public agreedPercentage;
    public numberOfPoints;
    public numberOfTimesReview;
    public positeVotes;
    public negativeVotes;
    public toRead = [];
}
