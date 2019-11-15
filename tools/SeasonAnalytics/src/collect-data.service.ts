import Web3 from "web3";
import axios from "axios"
import { Web3Service } from "./web3.service"
import { SeasonAnalyticsConfig } from "./season-analytics.config";
import { User, UserStats, UserSeason } from "./season-analytics.model"
import Contract from "web3/eth/contract";

interface ITrbSmartContractJson {
    abi: Array<Object>;
    networks: Array<any>;
}

export class CollectDataService {
    private brightAddress: string;
    private contractBright: ITrbSmartContractJson;
    private brightNew: Contract;
    private web3Websocket: Web3;
    private web3Service = new Web3Service();
    private users = new Array<User>();
    constructor() {
        this.web3Websocket = this.web3Service.openWebSocketConnection();
    }

    public startCollection(): Promise<boolean> {
        return this.getContractsJson().then(() => {
            this.brightNew = new this.web3Websocket.eth.Contract(this.contractBright.abi, this.brightAddress);
            return this.getDataSource();
        })
    }

    public getUsersData(): User[] {
        return this.users;
    }

    private getDataSource(): Promise<boolean>{
    
        let usersHash = new Array<string>();

        let seasonNumber: number;
        let seasonEndsTimestamps = new Array<number>();
        let seasonLengthSecs = 90 * 24 * 60 * 60;

        return this.brightNew.methods.getUsersAddress().call()
        .then((addresses: Array<string>) => {
            usersHash = addresses;
            let promises = addresses.map(userAddress => this.brightNew.methods.getUser(userAddress).call());
            return Promise.all(promises);
        }).then(usersData => {
            let promises = usersData.map((user, index) => {
                let newUser = new User();
                newUser.name = user[0];
                newUser.email = user[1];
                newUser.globalStats.reputation = user[5];
                newUser.globalStats.agreedPercentage = user[6];
                newUser.hash = usersHash[index];
                this.users.push(newUser);
                return this.brightNew.methods.getUserCommits(usersHash[index]).call();
            });
            return Promise.all(promises);
        }).then(usersCommits => {
            let promises = usersCommits.map((userCommit, index) => {
                this.users[index].globalStats = new UserStats();
                this.users[index].globalStats.reviewsMade = userCommit[1].length;
                this.users[index].globalStats.numberOfCommits = userCommit[2].length;
                return this.brightNew.methods.getVotes(usersHash[index], true, 0).call();
            });
            return Promise.all(promises);
        }).then(usersVotes => {
            let promises = usersVotes.map((userVotes, index) => {
                this.users[index].globalStats.positiveVotes = userVotes[0];
                this.users[index].globalStats.negativeVotes = userVotes[1];
                return this.brightNew.methods.getUserGlobalReputation(usersHash[index]).call()
            });
            return Promise.all(promises);

        }).then(reputation => {
            for (let i = 0; i < usersHash.length; i++) {
                for (let j = 0; j < reputation.length; j++) {
                    if (usersHash[i] === reputation[j][7]) {
                        this.users[i].globalStats.numberOfTimesReview = reputation[i][2];
                    }
                }
            }
            return this.brightNew.methods.getCurrentSeason().call();
        }).then((currentSeason) => {
            seasonNumber = currentSeason[0];
            this.users.forEach(user => user.seasonData = new Array<UserSeason>())
            for (let i = 0; i <= seasonNumber; i++) {
                seasonEndsTimestamps[i] = SeasonAnalyticsConfig.INITIAL_SEASON_TIMESTAMP + seasonLengthSecs * i;
                this.users.forEach((user) => {
                    user.seasonData[i] = new UserSeason();
                });
            }
            let promises = new Array<Promise<any>>();
            usersHash.forEach(userHash => {
                for (let i = 0; i <= seasonNumber; i++) {
                    let promise = this.brightNew.methods.getUserSeasonReputation(userHash, i).call();
                    promises.push(promise);
                }
            });
            return Promise.all(promises);
        }).then((seasonReputation) => {
            let counter = 0;
            let promises = new Array<Promise<any>>();
            this.users.forEach((user, index) => {
                for (let i = 0; i <= seasonNumber; i++) {
                    let userSeason = new UserSeason();
                    userSeason.seasonStats.reputation = Number(seasonReputation[counter][1] * SeasonAnalyticsConfig.WEIGHT_FACTOR);
                    userSeason.seasonStats.numberOfTimesReview = Number(seasonReputation[counter][2]);
                    userSeason.seasonStats.agreedPercentage = Number(seasonReputation[counter][4]);
                    userSeason.seasonStats.numberOfCommits = Number(seasonReputation[counter][5]);
                    userSeason.seasonStats.reviewsMade = Number(seasonReputation[counter][6]);
                    user.seasonData[i] = userSeason;
                    promises.push(this.brightNew.methods.getVotes(usersHash[index], false, i).call());
                    counter++;
                }
            });
            return Promise.all(promises);
        }).then((seasonVotes) => {
            let counter = 0;
            this.users.forEach((user) => {
                user.seasonData.forEach(userSeason => {
                    userSeason.seasonStats.positiveVotes = Number(seasonVotes[counter]["0"]);
                    userSeason.seasonStats.negativeVotes = Number(seasonVotes[counter]["1"]);
                    counter++;
                });
            });
            return true;
        }).catch(err => {
            console.log("Error getting the data");
            return false;
        });
    }

    private getContractsJson(): Promise<boolean> {
        return axios.get(SeasonAnalyticsConfig.BRIGHT_CONTRACT_URL).
        then(response => {
            this.contractBright = response.data;
            this.brightAddress = this.contractBright.networks[SeasonAnalyticsConfig.NETID].address;
        }).then(response => {
            return true;
        });

    }

}
