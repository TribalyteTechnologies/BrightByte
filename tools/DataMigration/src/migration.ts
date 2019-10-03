import Web3 from "web3";
import Tx = require("ethereumjs-tx");
import axios from 'axios'
import { Web3Service } from "./web3.service"
import { MigrationConfig } from "./migration.config";
import { TransactionReceipt } from "web3/types";


interface ITrbSmartContact { //Web3.Eth.Contract
    [key: string]: any;
}

interface ITrbSmartContractJson {
    abi: Array<any>;
}

export class MigrationService {
    private brightOldJson: any;
    private commitOldJson: any;
    private brightOldAddress: string;
    private commitOldAddress: string;
    private brightNewAddress: string;
    private commitNewAddress: string;
    private contractBright: any;
    private contractCommit: any;
    private web3: Web3;
    private web3Websocket: Web3;
    private web3Service = new Web3Service();
    private numberOfSets = 0;
    private currentNumberOfSets = 0;

    constructor() {
        this.web3Websocket = this.web3Service.openWebSocketConnection();
        this.web3 = this.web3Service.openHttpConnection();
        this.init().then(res => {
            this.brightOldAddress = this.brightOldJson.networks[MigrationConfig.NETID].address;
            this.commitOldAddress = this.commitOldJson.networks[MigrationConfig.NETID].address;
            this.brightNewAddress = this.contractBright.networks[MigrationConfig.NETID].address;
            this.commitNewAddress = this.contractCommit.networks[MigrationConfig.NETID].address;            
            this.startMigration();
        });
    }

    private init() {
        return axios.get(MigrationConfig.BRIGHT_OLD_CONTRACT_URL).
        then(response => {
            this.brightOldJson = response.data;
            return axios.get(MigrationConfig.COMMIT_OLD_CONTRACT_URL);
        }).then(response => {
            this.commitOldJson = response.data;
            return axios.get(MigrationConfig.BRIGHT_CONTRACT_URL);
        }).then(response => {
            this.contractBright = response.data;
            return axios.get(MigrationConfig.COMMIT_CONTRACT_URL);
        }).then(response => {
            this.contractCommit = response.data;
            return true;
        })
    }

    public startMigration() {
        this.getUserMigration();
    }

    public getUserMigration() {
        let brightOld = new this.web3Websocket.eth.Contract(this.brightOldJson.abi, this.brightOldAddress);
        let commitOld = new this.web3Websocket.eth.Contract(this.commitOldJson.abi, this.commitOldAddress);
        let brightNew = new this.web3.eth.Contract(this.contractBright.abi, this.brightNewAddress);
        let commitNew = new this.web3.eth.Contract(this.contractCommit.abi, this.commitNewAddress);

        let usersHash = new Array<string>();
        let users = new Array<User>();


        let commitsUrls = new Array<string>();
        let commits = new Array<CommitDataMigraton>();

        let seasonNumber: number;
        let seasonEndsTimestamps = new Array<number>();
        let seasonLengthSecs = 90 * 24 * 60 * 60;

        brightOld.methods.getUsersAddress().call()
        .then((addresses: Array<string>) => {
            usersHash = addresses;
            let promises = addresses.map(userAddress => brightOld.methods.getUser(userAddress).call());
            return Promise.all(promises);
        }).then(usersData => {
            let promises = usersData.map((user, index) => {
                let newUser = new User();
                newUser.name = user[0];
                newUser.email = user[1];
                newUser.globalStats.reputation = user[5];
                newUser.globalStats.agreedPercentage = user[6];
                newUser.hash = usersHash[index];
                users.push(newUser);
                return brightOld.methods.getUserCommits(usersHash[index]).call();
            });
            return Promise.all(promises);
        }).then(usersCommits => {
            let promises = usersCommits.map((userCommit, index) => {
                users[index].pendingReviews = userCommit[0];
                users[index].finishedReviews = userCommit[1];
                users[index].globalStats = new UserStats();
                users[index].globalStats.reviewsMade = userCommit[1].length;
                users[index].pendingCommits = userCommit[2];
                return brightOld.methods.getToRead(usersHash[index]).call();
            });
            return Promise.all(promises);
        }).then(userToRead => {
            userToRead.forEach((commitToRead, index) => users[index].toRead = commitToRead);
            let promises = usersHash.map(userHash => {
                return brightOld.methods.getVotes(userHash, true, 0).call();
            });
            return Promise.all(promises);
        }).then(usersVotes => {
            let promises = usersVotes.map((userVotes, index) => {
                users[index].globalStats.positiveVotes = userVotes[0];
                users[index].globalStats.negativeVotes = userVotes[1];
                return brightOld.methods.getUserGlobalReputation(usersHash[index]).call()
            });
            return Promise.all(promises);

        }).then(reputation => {
            for (let i = 0; i < usersHash.length; i++) {
                for (let j = 0; j < reputation.length; j++) {
                    if (usersHash[i] === reputation[j][7]) {
                        users[i].globalStats.numberOfTimesReview = reputation[i][2];
                    }
                }
            }
            return brightOld.methods.getCurrentSeason().call();
        }).then((currentSeason) => {
            seasonNumber = currentSeason[0];
            users.forEach(user => user.seasonData = new Array<UserSeason>())
            for (let i = 0; i <= seasonNumber; i++) {
                seasonEndsTimestamps[i] = MigrationConfig.INITIAL_SEASON_TIMESTAMP + seasonLengthSecs * i;
                users.forEach((user) => {
                    user.seasonData[i] = new UserSeason();
                    user.seasonData[i].urlSeasonCommits = new Array<string>();
                });
            }
            let promises = new Array<Promise<any>>();
            usersHash.forEach(userHash => {
                for (let i = 0; i <= seasonNumber; i++) {
                    let promise = brightOld.methods.getUserSeasonReputation(userHash, i).call();
                    promises.push(promise);
                }
            });
            return Promise.all(promises);
        }).then((seasonReputation) => {
            let counter = 0;
            let promises = new Array<Promise<any>>();
            users.forEach((user, index) => {
                for (let i = 0; i <= seasonNumber; i++) {
                    let userSeason = new UserSeason();
                    userSeason.seasonStats.reputation = Number(seasonReputation[counter][1] * MigrationConfig.WEIGHT_FACTOR);
                    userSeason.seasonStats.numberOfTimesReview = Number(seasonReputation[counter][2]);
                    userSeason.seasonStats.agreedPercentage = Number(seasonReputation[counter][4]);
                    userSeason.seasonStats.reviewsMade = Number(seasonReputation[counter][6]);
                    user.seasonData[i] = userSeason;
                    promises.push(brightOld.methods.getVotes(usersHash[index], false, i).call());
                    counter++;
                }
            });
            return Promise.all(promises);
        }).then((seasonVotes) => {
            let counter = 0;
            users.forEach((user, index) => {
                for (let i = 0; i < seasonNumber; i++) {
                    user.seasonData[i].seasonStats.positiveVotes = Number(seasonVotes[counter][0]);
                    user.seasonData[i].seasonStats.positiveVotes = Number(seasonVotes[counter][1]);
                    counter++;
                }
            });
            return commitOld.methods.getNumbers().call();
        }).then((commitsLength) => {
            let promises = new Array<Promise<any>>();
            for (let i = 0; i < commitsLength; i++) {
                promises.push(commitOld.methods.getAllCommitsId(i).call());
            }
            return Promise.all(promises);
        }).then((commitsUrl) => {
            commitsUrls = commitsUrl;
            let promises = commitsUrl.map(commitUrl => commitOld.methods.getDetailsCommits(commitUrl).call())
            return Promise.all(promises);

        }).then((commitsDetails) => {
            let found: boolean;
            let promises = commitsDetails.map((commitData, index) => {
                let commit = new CommitDataMigraton();
                commit.url = commitData[0];
                commit.title = commitData[1];
                commit.author = commitData[2];
                commit.creationDate = commitData[3];
                commit.lastModificationDate = commitData[4];
                commit.isReadNeeded = commitData[5];
                commit.numberReviews = commitData[6];
                commit.currentNumberReviews = commitData[7];
                commit.score = commitData[8] * MigrationConfig.WEIGHT_FACTOR;
                let urlKeccak = this.web3.utils.keccak256(commit.url);
                found = false;
                users.some(user => {
                    if (user.hash === commit.author) {
                        seasonEndsTimestamps.some((seasonEnd, index) => {
                            let asignedUrl = false;
                            if (commit.creationDate < seasonEnd) {
                                asignedUrl = true;
                                user.seasonData[index].urlSeasonCommits.push(urlKeccak);
                            }
                            return asignedUrl;
                        });
                        found = true;
                    }
                    return found;
                });
                commits.push(commit);
                return commitOld.methods.getCommitScores(commitsUrls[index]).call();
            });
            return Promise.all(promises);
        }).then(scoresCommits => {
            let promises = scoresCommits.map((scoresCommit, index) => {
                commits[index].weightedComplexity = scoresCommit[1] * MigrationConfig.WEIGHT_FACTOR;
                return commitOld.methods.getCommentsOfCommit(commitsUrls[index]).call();
            });
            return Promise.all(promises);
        }).then((commitComments) => {
            let promises = new Array<Promise<any>>();
            commitComments.forEach((comments, index) => {
                commits[index].pendingComments = comments[0];
                commits[index].finishedComments = comments[1];
                comments[1].forEach((finishedComment: any) => {
                    promises.push(commitOld.methods.getCommentDetail(commitsUrls[index], finishedComment).call())
                });
            })
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
                    if (comment[4] !== MigrationConfig.INVALID_USERS_ADDRESS) {
                        commits[index].commentDataMigration.push(newComment);
                    }
                    counter++;
                });
            });

            users.forEach(user => {
                user.seasonData.forEach((seasonData, index) => {
                    if (index === 3) {
                        let seasonReputation = 0;
                        let seasonCumulativeComplexity = 0;
                        seasonData.urlSeasonCommits.forEach(commitHash => {
                            let userCommit = new CommitDataMigraton();
                            userCommit = commits.find(commit => this.web3.utils.keccak256(commit.url) === commitHash);
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
            users = users.filter(user => MigrationConfig.EXCLUDED_USERS_ADDRESS.indexOf(user.hash) < 0);

            console.log("Setting Users" + users);
            console.log("Setting Commits" + commits);
            console.log("Setting Comments" + comments);

            this.numberOfSets = users.length + commits.length + comments.length;
            this.currentNumberOfSets = this.numberOfSets;

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
                        this.decreaseCount();
                        return this.sendTx(byteCodeData, this.brightNewAddress);
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
                                    return this.sendTx(byteCodeData, this.brightNewAddress);
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
                                    let totalCycles = data.urlSeasonCommits.length / MigrationConfig.NUMBER_SET_SEASON_COMMITS;
                                    let auxArray = new Array<number>();
                                    for (let t = 0; t < totalCycles; t++) {
                                        auxArray.push(t);
                                    }
                                    let i = 0;
                                    return auxArray.reduce(
                                        (prevVal3, actual) => {
                                            return prevVal3.then(() => {
                                                let sum = i + MigrationConfig.NUMBER_SET_SEASON_COMMITS;
                                                let seasonCommitsSliced = data.urlSeasonCommits.slice(i, sum);
                                                i = sum;
                                                let byteCodeData = brightNew
                                                    .methods
                                                    .setUrlsSeason(
                                                        index,
                                                        user.hash,
                                                        seasonCommitsSliced).encodeABI();
                                                return this.sendTx(byteCodeData, this.brightNewAddress);
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
                        if (arrayMax.length < user.finishedReviews.length) {
                            arrayMax = user.finishedReviews;
                        }
                        if (arrayMax.length < user.pendingReviews.length) {
                            arrayMax = user.pendingReviews;
                        }
                        if (arrayMax.length < user.toRead.length) {
                            arrayMax = user.toRead;
                        }
                        let timesToRepeat = (arrayMax.length / MigrationConfig.NUMBER_SET_COMMITS) + 1;
                        for (let p = 0; p < timesToRepeat; p++) {
                            arrayToCount.push(p);
                        }
                        let i: number = 0;
                        return arrayToCount.reduce(
                            (prevVal2, actual) => {
                                return prevVal2.then(() => {
                                    let sum: number = i + MigrationConfig.NUMBER_SET_COMMITS;
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
                                    return this.sendTx(byteCodeData, this.brightNewAddress);
                                });
                            },
                            Promise.resolve()
                        );
                    });
                },
                Promise.resolve()
            );

        }).then(trx => {
            console.log("Setting commits");
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
                        return this.sendTx(byteCodeData, this.commitNewAddress);
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
                        this.decreaseCount();
                        return this.sendTx(byteCodeData, this.commitNewAddress);
                    });
                },
                Promise.resolve()
            );
        }).then((trxResponse) => {
            console.log("Setting Comments");
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
                                    this.decreaseCount();
                                    return this.sendTx(byteCodeData, this.commitNewAddress);
                                });
                            },
                            Promise.resolve()
                        );
                    });
                },
                Promise.resolve()
            );
        }).then((trxResponse) => {
            console.log("Migration Finished");
        }).catch(err => console.log("Error in the migration " + err));
    }

    public sendTx(bytecodeData: any, contractAddress: any): Promise<void | TransactionReceipt> { //PromiEvent<TransactionReceipt>
        return this.web3.eth.getTransactionCount(MigrationConfig.USER_ADDRESS)
            .then(nonceValue => {
                let nonce = "0x" + (nonceValue).toString(16);
                let rawtx = {
                    nonce: nonce,
                    // I could use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                    gasPrice: this.web3.utils.toHex(MigrationConfig.GAS_PRICE),
                    gasLimit: this.web3.utils.toHex(MigrationConfig.GAS_LIMIT),
                    to: contractAddress,
                    data: bytecodeData
                };
                const tx = new Tx(rawtx);
                let priv = MigrationConfig.PRIVATE_KEY_ACCOUNT.substring(2);
                let privateKey = Buffer.from(priv, "hex");
                tx.sign(privateKey);

                let raw = "0x" + tx.serialize().toString("hex");
                return this.web3.eth.sendSignedTransaction(raw);
            }).then((transactionHash) => {
                console.log("Hash transaction: " + transactionHash.transactionHash);
                return transactionHash;
            }).catch((e) => {
                console.log("Error in transaction (sendTx function): " + e);
            });
    }

    private calculateCommitPonderation(cleanliness: Array<number>, complexity: Array<number>, revKnowledge: Array<number>): Array<number> {
        let WEIGHT_FACTOR = 10000;
        let weightedCleanliness = 0;
        let complexityPonderation = 0;
        let totalKnowledge = 0;
        for (let j = 0; j < cleanliness.length; j++) {
            totalKnowledge += Number(revKnowledge[j]);
        }
        for (let i = 0; i < cleanliness.length; i++) {
            let userKnowledge = (revKnowledge[i] * MigrationConfig.WEIGHT_FACTOR) / totalKnowledge;
            weightedCleanliness += (cleanliness[i] * userKnowledge);
            complexityPonderation += (complexity[i] * userKnowledge);
        }
        return [weightedCleanliness, complexityPonderation];
    }

    private calculateUserReputation(prevReputation: number, prevPonderation: number, commitScore: number, commitComplex: number, prevScore: number, prevComplex: number): Array<number> {
        let num = (prevReputation * prevPonderation) - (prevScore * prevComplex) + (commitScore * commitComplex);
        let cumulativePonderation = prevPonderation - prevComplex + commitComplex;
        let reputation = 0;
        if (cumulativePonderation) {
            reputation = (num) / cumulativePonderation;
        }
        return [reputation, cumulativePonderation];
    }

    private decreaseCount(){
        this.currentNumberOfSets--;
        console.log("Migration progress: "+ (MigrationConfig.PERCENTAGE - (this.currentNumberOfSets/this.numberOfSets) * MigrationConfig.PERCENTAGE) + "%");
    }

}

class User {
    public name = "";
    public email = "";
    public hash = "";
    public pendingCommits = new Array<string>();
    public finishedReviews = new Array<string>();
    public pendingReviews = new Array<string>();
    public toRead = new Array<string>();
    public globalStats: UserStats = new UserStats();
    public seasonData = new Array<UserSeason>();
}

class UserStats {
    public reputation = 0;
    public cumulativeComplexity = 0;
    public numberOfTimesReview = 0;
    public agreedPercentage = 0;
    public positiveVotes = 0;
    public negativeVotes = 0;
    public reviewsMade = 0;
}

class UserSeason {
    public seasonStats: UserStats = new UserStats();
    public urlSeasonCommits = new Array<string>();
}

class CommitDataMigraton {
    public title = "";
    public url = "";
    public author = "";
    public creationDate = 0;
    public isReadNeeded = false;
    public numberReviews = 0;
    public currentNumberReviews = 0;
    public lastModificationDate = 0;
    public score = 0;
    public weightedComplexity = 0;
    public pendingComments = new Array<string>();
    public finishedComments = new Array<string>();
    public commentDataMigration = new Array<CommentDataMigration>();
}

class CommentDataMigration {
    public text = "";
    public user = "";
    public points = new Array<number>();
    public vote = 0;
    public creationDateComment = 0;
    public lastModificationDateComment = 0;
    public isReadNeeded = false;
}

