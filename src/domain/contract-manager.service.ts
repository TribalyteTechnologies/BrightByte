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
import { AlertController } from "ionic-angular";

interface ItrbSmartContractJson {
    abi: Array<any>;
}

interface ItrbSmartContact { //Web3.Eth.Contract
    [key: string]: any;
}

@Injectable()
export class ContractManagerService {
    private contractAddress: string;
    private initPromOld: Promise<ItrbSmartContact>;
    private contractAddressRoot: string;
    private contractAddressBright: string;
    private contractAddressCommits: string;
    private log: ILogger;
    private web3: Web3;
    private initProm: Promise<Array<ItrbSmartContact>>;
    private currentUser: Account;
    private outOfGas: number;

    constructor(
        public http: HttpClient,
        public alertCtrl: AlertController,
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


       /////////////////////////////////MIGRATION///////////////////////////////////////////

    public initMigrationOld(user: Account): Promise<ItrbSmartContact> {
    this.currentUser = user;
    this.log.d("Initializing service with user ", this.currentUser);
    this.initPromOld = this.http.get("assets/build/BrightMigrationOld.json").toPromise()
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
    return this.initPromOld;
    }

    public getUserMigration(){
        this.outOfGas = 0;
        let name: string;
        let email: string;
        let numberCommitsReviewedByMe: number = 0;
        let reputation: number = 0;
        let numberOfTimesReview: number = 0;
        let numberOfPoints: number = 0; 
        let negativeVotes: number = 0;
        let positiveVotes: number = 0;
        let agreedPercentage: number = 0;
        let userCommits: string[] = [];
        let userCommitsLength: number;
        let commitsToReview: string[] = [];
        let commitsToReviewNumbComments: number[] = [];
        let commitsToReviewLength: number;
        let toRead = [];
        let pendingReviews = [];
        let finishedReviews = [];
        let numberOfFeed: number[] = [];
        let commitsArray: CommitDataMigraton[] = [];
        let contractBright;
        let brightNew;
        let commitNew;
        let rootNew;
        return this.initMigrationOld(this.currentUser)
        .then((contract) => {
            contractBright = contract;
            return contract.methods.getUser(this.currentUser.address).call();
        }).then((userData) => {
                name = userData[0];
                email = userData[1];
                numberCommitsReviewedByMe = userData[2];
                commitsToReviewLength = userData[3];
                userCommitsLength = userData[4];
                reputation = userData[5];     
                let promisesReput = new Array<Promise<any>>();
                for(let i = 0; i < userData.length; i++){
                    let promise = contractBright.methods.getAllUserReputation(i).call();
                    promisesReput.push(promise);
                }
                return Promise.all(promisesReput);
        }).then((userReput) => {
                for(let i = 0; i < userReput.length; i++){
                    if(userReput[i][0] === email){
                        numberOfPoints = userReput[i][3];
                    }
                }
                let promisesCommits = new Array<Promise<any>>();
                for(let i = 0; i < userCommitsLength; i++){
                    let promise = contractBright.methods.getUserCommits(i).call();
                    promisesCommits.push(promise);
                }
                return Promise.all(promisesCommits);
        }).then((commits) => {
            for(let i = 0; i < commits.length; i++){ 
                userCommits.push(this.web3.utils.keccak256(commits[i][0]));
            }
            for(let i = 0; i < commits.length; i++){
                let commitMigration = new CommitDataMigraton();
                commitMigration.title = commits[i][1];
                commitMigration.url = commits[i][0];
                commitMigration.author = this.currentUser.address;
                commitMigration.creationDate = commits[i][6];
                commitMigration.lastModificationDate = commits[i][7];
                commitMigration.score = commits[i][5];
                commitMigration.isReadNeeded = commits[i][4];
                commitMigration.finishedComments = [];
                commitMigration.pendingComments = [];
                commitMigration.commentDataMigration = [];
                commitMigration.points = 0;
                commitsArray.push(commitMigration);
            }
            let promisesCommitsDet = new Array<Promise<any>>();
            for(let i = 0; i < userCommitsLength; i++){
                let promise = contractBright.methods.getDetailsCommits(commits[i][0]).call();
                promisesCommitsDet.push(promise);
            }
            return Promise.all(promisesCommitsDet);
        }).then((commitDetail) => {
            for(let i = 0; i < commitDetail.length; i++){
                commitsArray[i].numberReviews = commitDetail[i][4];
                commitsArray[i].currentNumberReviews = commitDetail[i][6];
                commitsArray[i].points = commitsArray[i].score * commitsArray[i].currentNumberReviews;
            }
            let promises = new Array<Promise<any>>();
            for(let i = 0; i < commitDetail.length; i++){
                for(let j = 0; j < commitDetail[i][6]; j++){
                    let promise = contractBright.methods.getCommentsOfCommit(commitDetail[i][0], j).call();
                    promises.push(promise);
                }
            }
            return Promise.all(promises);
        }).then((comments) => {
            let counter = 0;
            for (let i = 0; i < commitsArray.length; i++){
                for (let j = 0; j < commitsArray[i].currentNumberReviews; j++){
                    let commentDataMigration = new CommentDataMigration();
                    commentDataMigration.text = comments[counter][0];
                    commentDataMigration.user = comments[counter][1];
                    commentDataMigration.scoreComment = comments[counter][3];
                    commentDataMigration.vote = comments[counter][4];
                    if(Number(commentDataMigration.vote) === 1){
                        commentDataMigration.vote = 2;
                    }else if(Number(commentDataMigration.vote) === 2){
                        commentDataMigration.vote = 1;
                    }
                    commentDataMigration.lastModificationDateComment = comments[counter][5];
                    commitsArray[i].commentDataMigration.push(commentDataMigration); 
                    commitsArray[i].finishedComments.push(commentDataMigration.user);
                    counter++;
                }
            }      
            let promisesComments = new Array<Promise<any>>();
            for(let i = 0; i < commitsToReviewLength; i++){
                let promise = contractBright.methods.getCommitsToReviewByMe(i).call();
                promisesComments.push(promise);
            }
            return Promise.all(promisesComments);
        }).then((commitsToReviewByMe) => {
            for(let i = 0; i < commitsToReviewByMe.length; i++){
                commitsToReview.push(commitsToReviewByMe[i][0]);
            }
            let promisesCommit = new Array<Promise<any>>();
            for(let i = 0; i < commitsToReviewByMe.length; i++){
                let promise = contractBright.methods.getNumbersNeedUrl(commitsToReviewByMe[i][0]).call();
                promisesCommit.push(promise);
            }
            return Promise.all(promisesCommit);
        }).then((numberOfFeedback) => {
            for(let i = 0; i < numberOfFeedback.length; i++){
                numberOfFeed.push(numberOfFeedback[i][1]);
            }

            let promisesCommit = new Array<Promise<any>>();
            for(let i = 0; i < commitsToReview.length; i++){
                for(let j = 0; j < numberOfFeedback[i][1]; j++){
                    let promise = contractBright.methods.isFeedback(j, commitsToReview[i]).call();
                    promisesCommit.push(promise);
                }
            }
            return Promise.all(promisesCommit);
        }).then((isFeedback) => {
            let counter = 0;
            let found: boolean = false;
            for (let i = 0; i < commitsToReview.length; i++){
                found = false;
                for (let j = 0; j < numberOfFeed[i]; j++){
                    if(isFeedback[counter] === true){
                        found = true;
                    }
                    counter++;
                }
                if(found){
                    toRead.push(this.web3.utils.keccak256(commitsToReview[i]));
                }
            }
            let promisesCommitsDet = new Array<Promise<any>>();
            for(let i = 0; i < commitsToReview.length; i++){
                let promise = contractBright.methods.getDetailsCommits(commitsToReview[i]).call();
                promisesCommitsDet.push(promise);
            }
            return Promise.all(promisesCommitsDet);
        }).then((commitDetail) => {
            for(let i = 0; i < commitDetail.length; i++){
                commitsToReviewNumbComments.push(commitDetail[i][6]);    
            }

            let promises = new Array<Promise<any>>();
            for(let i = 0; i < commitDetail.length; i++){
                for(let j = 0; j < commitDetail[i][6]; j++){
                    let promise = contractBright.methods.getCommentsOfCommit(commitDetail[i][0], j).call();
                    promises.push(promise);
                }
            }
            return Promise.all(promises);
        }).then((comments) => {
            let counter = 0;
            let found: boolean;
            let j: number = 0;
            let commitsNumber: number;
            for (let i = 0; i < commitsToReview.length; i++){
                found = false;
                j = 0;
                commitsNumber = commitsToReviewNumbComments[i];
                while (j < commitsNumber){
                    if(this.currentUser.address === comments[counter][1]){
                        found = true;
                        if(Number(comments[counter][4]) === 2){
                            positiveVotes++;      
                        }else if(Number(comments[counter][4]) === 1){
                            negativeVotes++;
                        }
                    }
                    counter++;  
                    j++;    
                }
                if(found){
                    finishedReviews.push(this.web3.utils.keccak256(commitsToReview[i]));
                }else{
                    pendingReviews.push(this.web3.utils.keccak256(commitsToReview[i]));
                }
            }
            if(positiveVotes + negativeVotes > 0) {
                agreedPercentage = (positiveVotes * 100) / (positiveVotes + negativeVotes);
            } else {
                agreedPercentage = 100;
            }
            this.log.w(commitsArray);
            this.log.w(pendingReviews);
            this.log.w(finishedReviews);
            this.log.w("Introducimos los valores");
            return this.initProm;
        }).then(([bright, commit, root]) => {
            brightNew = bright;
            commitNew = commit;
            rootNew = root;
            this.log.w("Introducimos Usuario");
            let byteCodeData = brightNew
            .methods
            .setAllUserData(
                name, 
                email, 
                this.currentUser.address, 
                agreedPercentage, numberOfPoints, numberOfTimesReview, positiveVotes, negativeVotes, reputation).encodeABI();
            return this.sendTx(byteCodeData, this.contractAddressBright);          
        }).then((trxResponse) => {
            let arrayMax = userCommits;
            let arrayToCount = [];
            if(arrayMax.length < finishedReviews.length){
                arrayMax = finishedReviews;
            }
            if(arrayMax.length < pendingReviews.length){
                arrayMax = pendingReviews;
            }
            if(arrayMax.length < toRead.length){
                arrayMax = toRead;
            }       
            let bucle = (arrayMax.length / 15) + 1;
            for(let j = 0; j < bucle; j++){
                arrayToCount.push(j);
            }
            let i: number = 0;
            this.log.w("Introducimos los arrays del usuario con slice");
            return arrayToCount.reduce(
                (prevVal, actual) => {
                    return prevVal.then(() => {
                        let suma: number = i + 15;
                        let comS = userCommits.slice(i, suma);
                        let finS = finishedReviews.slice(i, suma);
                        let pendS = pendingReviews.slice(i, suma);
                        let toReadS = toRead.slice(i, suma);
                        i = suma;
                        let byteCodeData = brightNew
                        .methods
                        .setAllUserDataTwo(this.currentUser.address, [], comS, finS, pendS, toReadS).encodeABI();
                        return this.sendTx(byteCodeData, this.contractAddressBright);
                    });
                }, 
                Promise.resolve()
            ); 
        }).then((trxResponse) => {   
            this.log.w("Introducimos los commits");
            return commitsArray.reduce(
                (prevVal, commit) => {
                    return prevVal.then(() => {
                        let byteCodeData = commitNew.methods.setAllCommitData(
                            commit.title, 
                            commit.url, 
                            commit.author, 
                            commit.creationDate,
                            commit.isReadNeeded, 
                            commit.lastModificationDate,
                            commit.numberReviews,
                            commit.currentNumberReviews, commit.score, commit.points
                        ).encodeABI();
                        return this.sendTx(byteCodeData, this.contractAddressCommits);
                    });
                },
                Promise.resolve()
            );
        }).then((trxResponse) => {
            this.log.w("Introducimos los commits (Pendcom...)");
            return commitsArray.reduce(
                (prevVal, commit) => {
                    return prevVal.then(() => {
                        let byteCodeData = commitNew.methods.setAllCommitDataTwo(
                            this.web3.utils.keccak256(commit.url), 
                            commit.pendingComments, 
                            commit.finishedComments
                        ).encodeABI();
                        return this.sendTx(byteCodeData, this.contractAddressCommits);
                    });
                },
                Promise.resolve()
            );
        }).then((trxResponse) => {
            this.log.w("Introducimos los comentarios");
            return commitsArray.reduce(
                (prevValCommit, commit) => {
                    return prevValCommit.then(() => {
                        return commit.commentDataMigration.reduce(
                            (prevVal, comment) => {
                                return prevVal.then(() => {
                                    let byteCodeData = commitNew.methods.setAllCommentData(
                                        this.web3.utils.keccak256(commit.url),
                                        comment.user,
                                        comment.text, 
                                        comment.user,
                                        comment.scoreComment, 
                                        comment.vote,
                                        comment.lastModificationDateComment,
                                        comment.lastModificationDateComment
                                    ).encodeABI();
                                    return this.sendTx(byteCodeData, this.contractAddressCommits); 
                                });
                            },
                            Promise.resolve()
                        );
                    });
                },
                Promise.resolve()
            );
        }).then((trxResponse) => {
            this.log.w("FIN");
            let alert = this.alertCtrl.create({
                title: "Migration",
                subTitle: "You have: " + this.outOfGas + " OutOfGas Errors" ,
                buttons: ["Accept"]
            });
            alert.present();
            this.outOfGas = 0;
        }).catch((err) => {
            throw err;
        });
    }
    
    public userSecondMigration(){
        let brightNew;
        let commitNew;
        let rootNew;
        let allAddress = [];
        return this.initProm
        .then(([bright, commit, root]) => {
            brightNew = bright;
            commitNew = commit;
            rootNew = root;           
            return brightNew.methods.getNumbers().call();
        }).then((numUsers) => {
            let promisesUsers = new Array<Promise<any>>();
            for(let i = 0; i < numUsers; i++){
                let promise = brightNew.methods.getAllUserEmail(i).call();
                promisesUsers.push(promise);
            }
            return Promise.all(promisesUsers);

        }).then((emailUsers) => {
            let promisesAddress = new Array<Promise<any>>();
            for(let i = 0; i < emailUsers.length; i++){
                let promise = brightNew.methods.getAddressByEmail(this.web3.utils.keccak256(emailUsers[i])).call();
                promisesAddress.push(promise);
            }
            return Promise.all(promisesAddress);
        }).then((address) => {
            let promisesUserDetails = new Array<Promise<any>>();
            for(let i = 0; i < address.length; i++){
                allAddress.push(address[i]);
                let promise = brightNew.methods.getUserCommits(address[i]).call();
                promisesUserDetails.push(promise);
            }
            return Promise.all(promisesUserDetails);     
        }).then((userCommits) => {
            return userCommits.reduce(
                (prevValueCom, userCom, i) => {
                    return prevValueCom.then(() => {
                        return userCom[0].reduce(
                            (prevValue, userComValue) => {
                                return prevValue.then(() => {
                                    let byteCodeData = commitNew.methods.setPendingCommentsData(
                                        userComValue, allAddress[i]
                                    ).encodeABI();
                                    return this.sendTx(byteCodeData, this.contractAddressCommits);
                                });    
                            },
                            Promise.resolve()
                        );
                    }); 
                },
                Promise.resolve()
            );    
        }).catch((err) => err);
    }

    private sendTx(bytecodeData, contractAddress): Promise<void | TransactionReceipt> { //PromiEvent<TransactionReceipt>
        return this.web3.eth.getTransactionCount(this.currentUser.address, "pending")
            .then(nonceValue => {
                let nonce = "0x" + (nonceValue).toString(16);
                this.log.d("Value NONCE", nonce);
                let rawtx = {
                    nonce: nonce,
                    // I could use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                    gasPrice: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG.gasPrice),
                    gasLimit: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG.gasLimit),
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
                if(transactionHash.gasUsed >= AppConfig.NETWORK_CONFIG.gasLimit){
                    this.log.e("Gas");
                    this.outOfGas ++;
                }
                return transactionHash;
            }).catch(e => {
                this.log.e("Error in transaction (sendTx function): ", e);
                throw e;
            });
    }
}



class CommitDataMigraton{
    public title: string;
    public url: string;
    public author;
    public creationDate: number;
    public isReadNeeded: boolean;
    public numberReviews: number;
    public currentNumberReviews: number;
    public lastModificationDate: number;
    public score: number;
    public points: number;
    public commitReviewPageFeedback: Array<any>;
    public pendingComments: Array<any>;
    public finishedComments: Array<any>;
    public commentDataMigration: Array<CommentDataMigration>;
}

class CommentDataMigration{
    public text: string;
    public user;
    public scoreComment: number;
    public vote: number; 
    public creationDateComment: number;
    public lastModificationDateComment: number;
}


