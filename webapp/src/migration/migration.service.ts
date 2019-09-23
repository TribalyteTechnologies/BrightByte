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
        return this.initPromV030 = Promise.all(contractPromises);
    }


    public getUserMigration() {
        const NUMBER_SET_COMMITS = 5;
        const EXCLUDED_USERS_ADDRESS = ["0x20426cfe5F88252209a72B682F30Ad79C43c40c2", "0x71b1647EEde246B98cd0528a78d6B4d397505131"];
        const INVALID_USERS_ADDRESS = "0x0000000000000000000000000000000000000000";
        const NUMBER_SET_SEASON_COMMITS = 25;
        const INITIAL_SEASON_TIMESTAMP = 1550047598;
        const SEASONS_TO_MIGRATE = 3;
        const WEIGHT_FACTOR = 10000;

        let brightV030;
        let commitV030;

        let brightNew;
        let commitNew;

        let usersHash = [];
        let users = [];
        

        let commitsUrls = [];
        let commits = [];

        let seasonNumber: number;
        let seasonEndsTimestamps = new Array<number>();

        let seasonLengthSecs = 90 * 24 * 60 * 60;

        let addresses = this.contractManagerService.getAddresses();
        let brightNewAddress = addresses[1];
        let commitNewAddress = addresses[2];
        

        return this.initPromV030
        .then(([bright, commit]) => {
            brightV030 = bright;
            commitV030 = commit;
            return this.contractManagerService.getContracts();
        }).then(([bright, commit, root]) => {
            brightNew = bright;
            commitNew = commit;
            
            return brightV030.methods.getUsersAddress().call();
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
                user.globalStats.reputation = userInfo[i][5];
                user.globalStats.agreedPercentage = userInfo[i][6];
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
            promises = usersHash.map(userHash => brightV030.methods.getUserGlobalReputation(userHash).call());
            return Promise.all(promises);

        }).then(reputation => {
            for(let i = 0; i < usersHash.length; i++){
                for(let j = 0; j < reputation.length; j++){
                    if(usersHash[i] === reputation[j][7]){
                        users[i].globalStats.numberOfTimesReview = reputation[i][2];
                    }
                }
            }

            return brightV030.methods.getCurrentSeason().call();
        }).then((numSeason) => {
            seasonNumber = SEASONS_TO_MIGRATE;
            seasonEndsTimestamps = new Array<number>(seasonNumber + 1).fill(null)
            .map((element, index) => INITIAL_SEASON_TIMESTAMP + seasonLengthSecs * index);
            
            let promises = new Array<Promise<any>>();

            usersHash.forEach(userHash => {
                for(let i = 0; i <= seasonNumber; i++){
                    let promise = brightV030.methods.getUserSeasonReputation(userHash, i).call();
                    promises.push(promise);
                }
            });
            return Promise.all(promises);
        }).then((seasonReputation) => {
            
            let counter = 0;
            for(let i = 0; i < usersHash.length; i++){
                for(let j = 0; j <= seasonNumber; j++){
                    let userSeason =  new UserSeason();
                    userSeason.seasonStats.reputation = seasonReputation[counter][1] * WEIGHT_FACTOR;
                    userSeason.seasonStats.numberOfTimesReview = seasonReputation[counter][2];
                    userSeason.seasonStats.agreedPercentage = seasonReputation[counter][4];
                    userSeason.seasonStats.reviewsMade = seasonReputation[counter][6];
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
                commit.score = commitsDetails[i][8] * WEIGHT_FACTOR;
                commits.push(commit);
                found = false;
                for(let j = 0; j < users.length && !found; j++){
                    let user = users[j]; 
                    if(user.hash === commit.author){
                        seasonEndsTimestamps.some((seasonEnd, index) => {
                            let asignedUrl = false;
                            if(commit.creationDate < seasonEnd) {
                                asignedUrl = true;
                                user.seasonData[index].urlSeasonCommits.push(urlKeccak);
                            } 
                            return asignedUrl;
                        });
                        found = true;
                    }
                }
            }

            let promisesAddress = new Array<Promise<any>>();
            for(let i = 0; i < commitsUrls.length; i++){
                let promise = commitV030.methods.getCommitScores(commitsUrls[i]).call();
                promisesAddress.push(promise);
            }
            return Promise.all(promisesAddress);

        }).then(scoresCommits => {
            scoresCommits.forEach((scoresCommit, index) => commits[index].weightedComplexity = scoresCommit[1] * WEIGHT_FACTOR);
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
            commitsUrls.forEach((commitUrl, index) => {
                commits[index].finishedComments.forEach(finishComment => {
                    let newComment = new CommentDataMigration();
                    let comment = comments[counter];
                    newComment.text = comment[0];
                    newComment.user = comment[4];
                    newComment.points.push(comment[5][0]);
                    newComment.points.push(comment[5][1]);
                    newComment.points.push(comment[5][2]);
                    newComment.vote = comment[1];
                    newComment.creationDateComment = comment[2];
                    newComment.lastModificationDateComment = comment[3];
                    if (comment[4] !== INVALID_USERS_ADDRESS) {
                        commits[index].commentDataMigration.push(newComment);
                    }
                    counter++;        
                });
            });

            users.forEach(user => {
                user.seasonData.forEach((seasonData, index) => {
                    if(index === 3) {
                        let seasonReputation = 0;
                        let seasonCumulativeComplexity = 0;
                        seasonData.urlSeasonCommits.forEach(commitHash => {
                            let userCommit = commits.find(commit => this.web3.utils.keccak256(commit.url) === commitHash);
                            let cleanliness = new Array<number>();
                            let complexity = new Array<number>();
                            let revKnowledge = new Array<number>();
                            userCommit.commentDataMigration.forEach(comment => {
                                cleanliness.push(comment.points[0]);
                                complexity.push(comment.points[1]);
                                revKnowledge.push(comment.points[2]);
                            });
                            let commitPonderation = this.calculateCommitPonderation(cleanliness, complexity, revKnowledge);
                            let reputationPonderation = this.calculateUserReputation
                            (seasonReputation, seasonCumulativeComplexity, commitPonderation[0], commitPonderation[1], 0, 0);

                            seasonReputation = reputationPonderation[0];
                            seasonCumulativeComplexity = reputationPonderation[1];
                        });
                        seasonData.seasonStats.reputation = Math.trunc(seasonReputation);
                        seasonData.seasonStats.cumulativeComplexity = Math.trunc(seasonCumulativeComplexity);
                    }
                });
            });

            users = users.filter(user => EXCLUDED_USERS_ADDRESS.indexOf(user.hash) < 0);

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
                                        data.seasonStats.reviewsMade, data.seasonStats.cumulativeComplexity).encodeABI(); // Reviews made
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
                                    let totalCycles = data.urlSeasonCommits.length / NUMBER_SET_SEASON_COMMITS;
                                    let auxArray = new Array<number>();
                                    for(let t = 0; t < totalCycles; t++) {
                                        auxArray.push(t);
                                    }
                                    let i = 0;
                                    return auxArray.reduce(
                                        (prevVal3, actual) => {
                                            return prevVal3.then(() => {
                                                let sum = i + NUMBER_SET_SEASON_COMMITS;
                                                let seasonCommitsSliced = data.urlSeasonCommits.slice(i, sum);
                                                i = sum;
                                                let byteCodeData = brightNew
                                                .methods
                                                .setUrlsSeason(
                                                    index,
                                                    user.hash,
                                                    seasonCommitsSliced).encodeABI();
                                                return this.contractManagerService.sendTx(byteCodeData, brightNewAddress);
                                            });
                                        },
                                        Promise.resolve()
                                    );
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
                            commit.currentNumberReviews, commit.score, commit.weightedComplexity).encodeABI();
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

    private calculateCommitPonderation(cleanliness: Array<number>, complexity: Array<number> , revKnowledge: Array<number>): Array<number> {
        let WEIGHT_FACTOR = 10000;
        let weightedCleanliness = 0;
        let complexityPonderation = 0;
        let totalKnowledge = 0;
        for (let j = 0; j < cleanliness.length; j++) {
            totalKnowledge += Number(revKnowledge[j]);
        }
        for (let i = 0; i < cleanliness.length; i++) {
            let userKnowledge = (revKnowledge[i] * WEIGHT_FACTOR) / totalKnowledge;
            weightedCleanliness += (cleanliness[i] * userKnowledge);
            complexityPonderation += (complexity[i] * userKnowledge);
        }
        return [weightedCleanliness, complexityPonderation];
    }
    
    private calculateUserReputation(prevReputation, prevPonderation, commitScore, commitComplex, prevScore, prevComplex): Array<number>{
        let num = (prevReputation * prevPonderation) - (prevScore * prevComplex) + (commitScore * commitComplex);
        let cumulativePonderation = prevPonderation - prevComplex + commitComplex;
        let reputation = (num) / cumulativePonderation;
        return [reputation, cumulativePonderation];
    }
    
}

class User{
    public name: string;
    public email: string;
    public hash: string;
    public pendingCommits = new Array<string>();
    public finishedReviews = new Array<string>();
    public pendingReviews = new Array<string>();
    public toRead = new Array<string>();
    public globalStats: UserStats = new UserStats();
    public seasonData = new Array<UserSeason>();

}

class UserStats {
    public reputation: number;
    public cumulativeComplexity = 0;
    public numberOfTimesReview: number;
    public agreedPercentage: number;
    public positiveVotes: number;
    public negativeVotes: number;
    public reviewsMade: number;
}

class UserSeason {
    public seasonStats: UserStats = new UserStats();
    public urlSeasonCommits = new Array<string>();
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
    public weightedComplexity = 0;
    public pendingComments = new Array<string>();
    public finishedComments = new Array<string>();
    public commentDataMigration = new Array<CommentDataMigration>();
}

class CommentDataMigration{
    public text: string;
    public user: string;
    public points = new Array<number>();
    public vote: number; 
    public creationDateComment: number;
    public lastModificationDateComment: number;
    public isReadNeeded: boolean;
}

