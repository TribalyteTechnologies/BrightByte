import { Injectable } from "@angular/core";
import { default as Web3 } from "web3";
import { Web3Service } from "../core/web3.service";
import { ILogger, LoggerService } from "../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { default as TruffleContract } from "truffle-contract";
import { AppConfig } from "../app.config";
import { Account } from "web3/types";
import { ContractManagerService } from "../domain/contract-manager.service";
import { AlertController, LoadingController } from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";
import { LoginService } from "../core/login.service";


interface ITrbSmartContact { //Web3.Eth.Contract
    [key: string]: any;
}

interface ITrbSmartContractJson {
    abi: Array<any>;
}

@Injectable()
export class MigrationService {
    
    public msg: string;
    public text: string;
    private contractAddressRootV030: string;
    private contractAddressBrightV030: string;
    private contractAddressCommitsV030: string;
    private initPromV030: Promise<Array<ITrbSmartContact>>;
    private log: ILogger;
    private web3: Web3;
    private currentUser;
    

    constructor(
        private http: HttpClient,
        private web3Service: Web3Service,
        private loggerSrv: LoggerService,
        private contractManagerService: ContractManagerService,
        private alertCtrl: AlertController,
        private loadingCtrl: LoadingController,
        private translateService: TranslateService,
        private loginService: LoginService
    ) {
        this.log = loggerSrv.get("MigrationService");
        this.web3 = web3Service.getWeb3();
        this.web3Service = web3Service;
    }

    public startMigration(pass: string, text) {
        let alert = this.alertCtrl.create({
            title: this.obtainTranslation("migration.migrationTitle"),
            subTitle: this.obtainTranslation("migration.migrationSuc"),
            buttons: [this.obtainTranslation("alerts.accept")]
        });

        let alertError = this.alertCtrl.create({
            title: this.obtainTranslation("alerts.error"),
            subTitle: this.obtainTranslation("migration.migrationErr"),
            buttons: [this.obtainTranslation("alerts.accept")]
        });

        let loader = this.loadingCtrl.create();
        loader.present();
        try {
            this.log.d("File imported: ", text);
            if (text === undefined) {
                this.log.e("File not loaded");
                this.translateService.get("app.fileNotLoaded").subscribe(
                    msg => {
                        loader.dismiss();
                        this.msg = msg;
                    });
            } else {
                let account = this.web3Service.getWeb3().eth.accounts.decrypt(text, pass);
                this.log.d("Imported account from the login file: ", account);
                this.loginService.setAccount(account);
                this.contractManagerService.init(account, 0)
                    .then(() => {
                        return this.initOld(account, 0);
                    }).then((result) => {
                        return this.getUserMigration();
                    }).then((result) => {
                        loader.dismiss();
                        alert.present();
                    })
                    .catch((e) => {
                        window.alert(e);
                        this.translateService.get("app.noRpc").subscribe(
                            msg => {
                                loader.dismiss();
                                this.msg = msg;
                            });
                        this.log.e("ERROR getting user or checking if this user has already set his profile: ", e);
                        loader.dismiss();
                        alertError.present();
                    });

            }
        } catch (e) {
            this.translateService.get("app.wrongPassword").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                    loader.dismiss();
                });
        }
    }

    /////////////////MIGRATION FROM v0.3.0 to v0.4.0/////////////////////////



    public initOld(user: Account, cont: number): Promise<any> {
        AppConfig.CURRENT_NODE_INDEX = cont;
        let configNet = AppConfig.NETWORK_CONFIG[cont];
        this.web3Service = new Web3Service(this.loggerSrv);
        this.web3 = this.web3Service.getWeb3();
        this.log.d("Initializing with URL: " + configNet.urlNode);
        this.currentUser = user;
        this.log.d("Initializing service with user ", this.currentUser);
        let contractPromises = new Array<Promise<ITrbSmartContact>>();
        let promBright = this.http.get("../assets/build/BrightOld.json").toPromise()
            .then((jsonContractData: ITrbSmartContractJson) => {
                let truffleContractBright = TruffleContract(jsonContractData);
                this.contractAddressBrightV030 = truffleContractBright.networks[configNet.netId].address;
                let contractBright = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressBrightV030, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
                    data: truffleContractBright.deployedBytecode
                });
                this.log.d("TruffleContractBright function: ", contractBright);
                this.log.d("ContractAddressBright: ", this.contractAddressBrightV030);
                return contractBright;
            });
        contractPromises.push(promBright);
        let promCommits = this.http.get("../assets/build/CommitsOld.json").toPromise()
            .then((jsonContractData: ITrbSmartContractJson) => {
                let truffleContractCommits = TruffleContract(jsonContractData);
                this.contractAddressCommitsV030 = truffleContractCommits.networks[configNet.netId].address;
                let contractCommits = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressCommitsV030, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
                    data: truffleContractCommits.deployedBytecode
                });
                this.log.d("TruffleContractBright function: ", contractCommits);
                this.log.d("ContractAddressCommits: ", this.contractAddressCommitsV030);
                return contractCommits;
            });
        contractPromises.push(promCommits);
        let promRoot = this.http.get("../assets/build/RootOld.json").toPromise()
            .then((jsonContractData: ITrbSmartContractJson) => {
                let truffleContractRoot = TruffleContract(jsonContractData);
                this.contractAddressRootV030 = truffleContractRoot.networks[configNet.netId].address;
                let contractRoot = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressRootV030, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
                    data: truffleContractRoot.deployedBytecode
                });
                this.log.d("TruffleContractBright function: ", contractRoot);
                this.log.d("ContractAddressRoot: ", this.contractAddressRootV030);
                return contractRoot;
            });
        contractPromises.push(promRoot);
        return this.initPromV030 = Promise.all(contractPromises);
    }


    public getUserMigration() {
        const NUMBER_SET_COMMITS = 5;
        const EXCLUDED_USERS_ADDRESS = ["0x5b0244CF47f017c69835633D7ac77BbA142D45Ee"];
        const NUMBER_SET_SEASON_COMMITS = 25;

        let brightV030;
        let commitV030;
        let rootV030;

        let brightNew;
        let commitNew;
        let rootNew;

        let usersHash = [];
        let users = [];
        

        let commitsUrls = [];
        let commits = [];

        let seasonNumber: number;

        let seasonLengthSecs: number = 90 * 24 * 60 * 60;

        let season0End;
        let season1End;

        let addresses = this.contractManagerService.getAddresses();
        let brightNewAddress = addresses[1];
        let commitNewAddress = addresses[2];
        

        return this.initPromV030
        .then(([bright, commit, root]) => {
            brightV030 = bright;
            commitV030 = commit;
            rootV030 = root;
            return this.contractManagerService.getContracts();
        }).then(([bright, commit, root]) => {
            brightNew = bright;
            commitNew = commit;
            rootNew = root;
            
            return brightV030.methods.getNumbers().call();
        }).then(userNumber => {

            let promises = new Array<Promise<any>>();

            for(let i = 0; i < userNumber; i++){
                let promise = brightV030.methods.getAllUserEmail(i).call();
                promises.push(promise);
            }
            return Promise.all(promises);
        }).then(emails => {
            let promises = new Array<Promise<any>>();

            for(let i = 0; i < emails.length; i++){
                let promise = brightV030.methods.getAddressByEmail(this.web3.utils.keccak256(emails[i])).call();
                promises.push(promise);
            }
            return Promise.all(promises);
        }).then(addr => {
            let promises = new Array<Promise<any>>();
            usersHash = addr;
            for(let i = 0; i < addr.length; i++){
                let promise = brightV030.methods.getUser(addr[i]).call();
                promises.push(promise);
            }
            return Promise.all(promises);
        }).then(userInfo => {

            for(let i = 0; i < userInfo.length; i++){
                let user = new User();
                user.name = userInfo[i][0];
                user.email = userInfo[i][1];
                user.globalStats.reputation = userInfo[i][6];
                user.globalStats.agreedPercentage = userInfo[i][7];
                user.hash = usersHash[i];
                users.push(user);
            }

            let promises = new Array<Promise<any>>();

            for(let i = 0; i < usersHash.length; i++){
                let promise = brightV030.methods.getUserCommits(usersHash[i]).call();
                promises.push(promise);
            }
            return Promise.all(promises);

        }).then(userCommits => {
            for(let i = 0; i < userCommits.length; i++){
                users[i].pendingReviews = userCommits[i][0];
                users[i].finishedReviews = userCommits[i][1];
                users[i].globalStats.reviewsMade = userCommits[i][1].length;
                users[i].pendingCommits = userCommits[i][2];
            }

            let promises = new Array<Promise<any>>();

            for(let i = 0; i < usersHash.length; i++){
                let promise = brightV030.methods.getToRead(usersHash[i]).call();
                promises.push(promise);
            }
            return Promise.all(promises);

        }).then(userToRead => {
            for(let i = 0; i < userToRead.length; i++){
                users[i].toRead = userToRead[i];

            }

            let promises = new Array<Promise<any>>();

            for(let i = 0; i < usersHash.length; i++){
                let promise = brightV030.methods.getVotes(usersHash[i], true, 0).call();
                promises.push(promise);
            }
            return Promise.all(promises);

        }).then(userVotes => {
            for(let i = 0; i < userVotes.length; i++){
                users[i].globalStats.positiveVotes = userVotes[i][0];
                users[i].globalStats.negativeVotes = userVotes[i][1];
            }

            let promises = new Array<Promise<any>>();

            for(let i = 0; i < usersHash.length; i++){
                let promise = brightV030.methods.getAllUserReputation(i).call();
                promises.push(promise);
            }
            return Promise.all(promises);

        }).then(reputation => {
            for(let i = 0; i < usersHash.length; i++){
                for(let j = 0; j < reputation.length; j++){
                    if(usersHash[i] === reputation[j][8]){
                        users[i].globalStats.numberOfTimesReview = reputation[i][2];
                    }
                }
            }

            return brightV030.methods.getCurrentSeason().call();
        }).then((numSeason) => {
            seasonNumber = numSeason[0];
            season1End = numSeason[1];
            season0End = (season1End - seasonLengthSecs);
            
            let promises = new Array<Promise<any>>();

            for(let i = 0; i < usersHash.length; i++){
                for(let j = 0; j <= seasonNumber; j++){
                    let promise = brightV030.methods.getUserReputation(i, j).call();
                    promises.push(promise);
                }
            }
            return Promise.all(promises);

        }).then((seasonReputation) => {
            
            let counter = 0;
            for(let i = 0; i < usersHash.length; i++){
                for(let j = 0; j <= seasonNumber; j++){
                    let userSeason =  new UserSeason();
                    userSeason.seasonStats.reputation = seasonReputation[counter][1];
                    userSeason.seasonStats.numberOfTimesReview = seasonReputation[counter][2];
                    userSeason.seasonStats.agreedPercentage = seasonReputation[counter][5];
                    userSeason.seasonStats.reviewsMade = seasonReputation[counter][7];
                    users[i].seasonData.push(userSeason);
                    counter ++;
                }
            }
            
            let promises = new Array<Promise<any>>();

            for(let i = 0; i < usersHash.length; i++){
                for(let j = 0; j <= seasonNumber; j++){
                    let promise = brightV030.methods.getVotes(usersHash[i], false, j).call();
                    promises.push(promise);
                }
            }
            return Promise.all(promises);

        }).then((seasonVotes) => {

            let counter = 0;
            for(let i = 0; i < usersHash.length; i++){
                for(let j = 0; j <= seasonNumber; j++){
                    users[i].seasonData[j].seasonStats.positiveVotes = seasonVotes[counter][0];
                    users[i].seasonData[j].seasonStats.negativeVotes = seasonVotes[counter][1];
                    counter ++;
                }
            }

            this.log.d("Users: " + users);


            return commitV030.methods.getNumbers().call();
        }).then((commitsLen) => {
            let promisesAddress = new Array<Promise<any>>();
            for(let i = 0; i < commitsLen; i++){
                let promise = commitV030.methods.getAllCommitsId(i).call();
                promisesAddress.push(promise);
            }
            return Promise.all(promisesAddress);

        }).then((commitsUrl) => {
            commitsUrls = commitsUrl;
            let promisesAddress = new Array<Promise<any>>();
            for(let i = 0; i < commitsUrl.length; i++){
                let promise = commitV030.methods.getDetailsCommits(commitsUrl[i]).call();
                promisesAddress.push(promise);
            }
            return Promise.all(promisesAddress);

        }).then((commitsDetails) => {
            let found: boolean;
            for(let i = 0; i < commitsDetails.length; i++){
                let commit = new CommitDataMigraton();
                commit.url = commitsDetails[i][0];
                let urlKeccak = this.web3.utils.keccak256(commit.url);
                commit.title = commitsDetails[i][1];
                commit.author = commitsDetails[i][2];
                commit.creationDate = commitsDetails[i][3];
                commit.lastModificationDate = commitsDetails[i][4];
                commit.isReadNeeded = commitsDetails[i][5];
                commit.numberReviews = commitsDetails[i][6];
                commit.currentNumberReviews = commitsDetails[i][7];
                commit.score = commitsDetails[i][8];
                commits.push(commit);
                found = false;
                for(let j = 0; j < users.length && !found; j++){
                    let user = users[j]; 
                    if(user.hash === commit.author){
                        if(commit.creationDate < season0End){
                            user.seasonData[0].urlSeasonCommits.push(urlKeccak);
                        } else if (commit.creationDate < season1End){
                            user.seasonData[1].urlSeasonCommits.push(urlKeccak);
                        } else{
                            user.seasonData[2].urlSeasonCommits.push(urlKeccak);
                        }
                        found = true;
                    }
                }
            }
           
            let promisesAddress = new Array<Promise<any>>();
            for(let i = 0; i < commitsUrls.length; i++){
                let promise = commitV030.methods.getCommentsOfCommit(commitsUrls[i]).call();
                promisesAddress.push(promise);
            }
            return Promise.all(promisesAddress);
        }).then((pendFinCom) => {
            for(let i = 0; i < pendFinCom.length; i++){
                commits[i].pendingComments = pendFinCom[i][0];
                commits[i].finishedComments = pendFinCom[i][1];
            }

            let promisesAddress = new Array<Promise<any>>();
            for(let i = 0; i < commitsUrls.length; i++){
                let promise = commitV030.methods.getCommentsOfCommit(commitsUrls[i]).call();
                promisesAddress.push(promise);
            }
            return Promise.all(promisesAddress);
        }).then((pendFinCom) => {
            for(let i = 0; i < pendFinCom.length; i++){
                commits[i].pendingComments = pendFinCom[i][0];
                commits[i].finishedComments = pendFinCom[i][1];
            }

            let promises = new Array<Promise<any>>();
            for(let i = 0; i < commitsUrls.length; i++){
                for(let j = 0; j < pendFinCom[i][1].length; j++){
                    let promise = commitV030.methods.getCommentDetail(commitsUrls[i], commits[i].finishedComments[j]).call();
                    promises.push(promise);
                }
            }
            return Promise.all(promises);
        }).then((comments) => {
            let counter = 0;
            for(let i = 0; i < commitsUrls.length; i++){
                for(let j = 0; j < commits[i].finishedComments.length; j++){
                    let comment = new CommentDataMigration();
                    comment.text = comments[counter][0];
                    comment.user = comments[counter][5];
                    comment.points.push(comments[counter][1] * 100);
                    comment.points.push(0);
                    comment.points.push(0);
                    comment.vote = comments[counter][2];
                    comment.creationDateComment = comments[counter][3];
                    comment.lastModificationDateComment = comments[counter][4];                                 
                    commits[i].commentDataMigration.push(comment);
                    counter ++; 
                } 
            }

            users = users.filter(user => {
                return excludedUserAddress.indexOf(user) < 0;
            });

            this.log.d("Setting Users" + users);
            this.log.d("Setting Commits" + commits);
            this.log.d("Setting Comments" + comments);
            return users.reduce(
                (prevVal, user) => {
                    return prevVal.then(() => {
                        let byteCodeData = brightNew
                        .methods
                        .setAllUserData(
                            user.name, 
                            user.email, 
                            user.hash, 
                            user.globalStats.agreedPercentage, 
                            user.globalStats.numberOfTimesReview, user.globalStats.positiveVotes, 
                            user.globalStats.negativeVotes, user.globalStats.reputation,
                            user.globalStats.reviewsMade).encodeABI(); // Reviews made
                        return this.contractManagerService.sendTx(byteCodeData, brightNewAddress);
                    });
                }, 
                Promise.resolve()
            );
        
        }).then(trxResponse => { 
            return users.reduce(
                (prevVal, user) => {
                    return prevVal.then(() => {  
                        return user.seasonData.reduce(
                            (prevVal2, data, index) => {
                                return prevVal2.then(() => {
                                    let byteCodeData = brightNew
                                    .methods
                                    .setAllUserSeasonData(
                                        index, 
                                        user.hash,
                                        data.seasonStats.agreedPercentage, 
                                        data.seasonStats.numberOfTimesReview, data.seasonStats.positiveVotes, 
                                        data.seasonStats.negativeVotes, data.seasonStats.reputation,
                                        data.seasonStats.reviewsMade).encodeABI(); // Reviews made
                                    return this.contractManagerService.sendTx(byteCodeData, brightNewAddress);
                                });
                            }, 
                            Promise.resolve()
                        );
                    });
                }, 
                Promise.resolve()
            );

        }).then(trxResponse => { 
            return users.reduce(
                (prevVal, user) => {
                    return prevVal.then(() => { 
                        return user.seasonData.reduce(
                            (prevVal2, data, index) => {
                                return prevVal2.then(() => {
                                    let num = data.urlSeasonCommits.length / NUMBER_SET_SEASON_COMMITS;
                                    let arr = [];
                                    for(let t = 0; t < num; t++) {
                                        arr.push(t);
                                    }
                                    let i = 0;
                                    return arr.reduce(
                                        (prevVal2, actual) => {
                                            return prevVal2.then(() => {
                                                let sum = i + NUMBER_SET_SEASON_COMMITS;
                                                let sli = data.urlSeasonCommits.slice(i, sum);
                                                i = sum;
                                                let byteCodeData = brightNew
                                                .methods
                                                .setUrlsSeason(
                                                    index,
                                                    user.hash,
                                                    sli).encodeABI();
                                                return this.contractManagerService.sendTx(byteCodeData, brightNewAddress);
                                            });
                                        },
                                        Promise.resolve()
                                    )
                                });
                            }, 
                            Promise.resolve()
                        );
                    });
                }, 
                Promise.resolve()
            );
        }).then(trxResponse => { 

            return users.reduce(
                    (prevVal, user) => {
                        return prevVal.then(() => {
                            let arrayMax = user.pendingCommits;
                            let arrayToCount = [];
                            if(arrayMax.length < user.finishedReviews.length){
                                arrayMax = user.finishedReviews;
                            }
                            if(arrayMax.length < user.pendingReviews.length){
                                arrayMax = user.pendingReviews;
                            }
                            if(arrayMax.length < user.toRead.length){
                                arrayMax = user.toRead;
                            }       
                            let timesToRepeat = (arrayMax.length / NUMBER_SET_COMMITS) + 1;
                            for(let p = 0; p < timesToRepeat; p++){
                                arrayToCount.push(p);
                            }
                            let i: number = 0;
                            this.log.d("Setting user's commits with slice");
                            return arrayToCount.reduce(
                                (prevVal2, actual) => {
                                    return prevVal2.then(() => {
                                        let sum: number = i + NUMBER_SET_COMMITS;
                                        let comS = user.pendingCommits.slice(i, sum);
                                        let finS = user.finishedReviews.slice(i, sum);
                                        let pendS = user.pendingReviews.slice(i, sum);
                                        let toReadS = user.toRead.slice(i, sum);
                                        i = sum;
                
                                        let byteCodeData = brightNew
                                        .methods
                                        .setAllUserDataTwo(
                                            user.hash,  
                                            comS, 
                                            finS,
                                            pendS, 
                                            toReadS).encodeABI();
                                        return this.contractManagerService.sendTx(byteCodeData, brightNewAddress);
                                    });
                                }, 
                                Promise.resolve()
                            );
                        });
                    },
                    Promise.resolve()
                );

        }).then(trx => {
            
            this.log.d("Setting commits");
            return commits.reduce(
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
                            commit.currentNumberReviews, commit.score).encodeABI();
                        return this.contractManagerService.sendTx(byteCodeData, commitNewAddress);
                    });
                },
                Promise.resolve()
            );
        }).then((trxResponse) => {
            return commits.reduce(
                (prevVal, commit) => {
                    return prevVal.then(() => {
                        let byteCodeData = commitNew.methods.setAllCommitDataTwo(
                            this.web3.utils.keccak256(commit.url), 
                            commit.pendingComments, 
                            commit.finishedComments
                        ).encodeABI();
                        return this.contractManagerService.sendTx(byteCodeData, commitNewAddress);
                    });
                },
                Promise.resolve()
            );
        }).then((trxResponse) => {
            this.log.d("Setting Comments");
            return commits.reduce(
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
                                        comment.points, 
                                        comment.vote,
                                        comment.lastModificationDateComment,
                                        comment.lastModificationDateComment
                                    ).encodeABI();
                                    return this.contractManagerService.sendTx(byteCodeData, commitNewAddress); 
                                });
                            },
                            Promise.resolve()
                        );
                    });
                },
                Promise.resolve()
            );
            
        }).then((trxResponse) => {
            this.log.d("Migration Finished");
        });

    }

    private obtainTranslation(translation: string): string{
        let translatedText = "";
        this.translateService.get(translation).subscribe(
            msg => {
                translatedText = msg;
            });
        return translatedText;
    } 
}

class User{
    public name: string;
    public email: string;
    public hash;
    public pendingCommits = [];
    public finishedReviews = [];
    public pendingReviews = [];
    public toRead = [];
    public globalStats: UserStats = new UserStats();
    public seasonData = [];

}

class UserStats {
    public reputation: number;
    public numberOfTimesReview: number;
    public agreedPercentage: number;
    public positiveVotes: number;
    public negativeVotes: number;
    public reviewsMade: number;
}

class UserSeason {
    public seasonStats: UserStats = new UserStats();
    public urlSeasonCommits = [];
    public totalScore: number = 0;
    public seasonWeigh: number = 0;
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
    public pendingComments: Array<any>;
    public finishedComments: Array<any>;
    public commentDataMigration = [];
    public totalScore: number = 0;
}

class CommentDataMigration{
    public text: string;
    public user;
    public points = [];
    public vote: number; 
    public creationDateComment: number;
    public lastModificationDateComment: number;
    public isReadNeeded: boolean;
}

