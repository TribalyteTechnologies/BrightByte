import { Injectable } from "@angular/core";
import { default as Web3 } from "web3";
import { Web3Service } from "../core/web3.service";
import { ILogger, LoggerService } from "../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app.config";
import Tx from "ethereumjs-tx";
import { TransactionReceipt, Account } from "web3/types";
import { CommitDetails } from "../models/commit-details.model";
import { UserDetails } from "../models/user-details.model";
import { CommitComment } from "../models/commit-comment.model";
import { UserCommit } from "../models/user-commit.model";
import { UserReputation } from "../models/user-reputation.model";
import { UserSeasonState } from "../models/user-season-state.model";
import { UserCacheService } from "../domain/user-cache.service";
import { LocalStorageService } from "../core/local-storage.service";
import { TeamMember } from "../models/team-member.model";
import { InvitedUser } from "../models/invited-user.model";
import { EncryptionUtils } from "../core/encryption-utils";
import { FormatUtils } from "../core/format-utils";

interface IContractJson {
    abi: Array<Object>;
    networks: Array<any>;
}

interface ITrbSmartContact { //Web3.Eth.Contract
    [key: string]: any;
}

@Injectable()
export class ContractManagerService {

    private contractAddressRoot: string;
    private contractAddressBright: string;
    private contractAddressCommits: string;
    private contractAddressTeamManager: string;
    private contractAddressBbFactory: string;

    private contractJsonRoot: IContractJson;
    private contractJsonBright: IContractJson;
    private contractJsonCommits: IContractJson;

    private log: ILogger;
    private web3: Web3;
    private initProm: Promise<Array<ITrbSmartContact>>;
    private currentUser: Account;
    private teamUids: Array<number>;
    private currentTeamUid: number;

    constructor(
        private http: HttpClient,
        private web3Service: Web3Service,
        private loggerSrv: LoggerService,
        private userCacheSrv: UserCacheService,
        private storageSrv: LocalStorageService
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
        this.currentUser = user;
        this.log.d("Initializing service with user ", this.currentUser);
        let contractPromises = new Array<Promise<ITrbSmartContact>>();
        let promBright = this.http.get(AppConfig.BRIGHT_CONTRACT_PATH).toPromise()
            .then((jsonContractData: IContractJson) => {
                this.contractJsonBright = jsonContractData;
                let brightContractJson = jsonContractData;
                this.contractAddressBright = brightContractJson.networks[configNet.netId].address;
                let contractBright = new this.web3.eth.Contract(brightContractJson.abi, this.contractAddressBright);
                this.log.d("TruffleContractBright function: ", contractBright);
                this.log.d("ContractAddressBright: ", this.contractAddressBright);
                return contractBright;
            });
        contractPromises.push(promBright);
        let promCommits = this.http.get(AppConfig.COMMITS_CONTRACT_PATH).toPromise()
            .then((jsonContractData: IContractJson) => {
                this.contractJsonCommits = jsonContractData;
                let commitContractJson = jsonContractData;
                this.contractAddressCommits = commitContractJson.networks[configNet.netId].address;
                let contractCommits = new this.web3.eth.Contract(commitContractJson.abi, this.contractAddressCommits);
                this.log.d("TruffleContractCommits function: ", contractCommits);
                this.log.d("ContractAddressCommits: ", this.contractAddressCommits);
                return contractCommits;
            });
        contractPromises.push(promCommits);
        let promRoot = this.http.get(AppConfig.ROOT_CONTRACT_PATH).toPromise()
            .then((jsonContractData: IContractJson) => {
                this.contractJsonRoot = jsonContractData;
                let rootContractJson = jsonContractData;
                this.contractAddressRoot = rootContractJson.networks[configNet.netId].address;
                let contractRoot = new this.web3.eth.Contract(rootContractJson.abi, this.contractAddressRoot);
                this.log.d("TruffleContractRoot function: ", contractRoot);
                this.log.d("ContractAddressRoot: ", this.contractAddressRoot);
                return contractRoot;
            });
        contractPromises.push(promRoot);
        let promTeamManager = this.http.get(AppConfig.TEAM_MANAGER_CONTRACT_PATH).toPromise()
            .then((jsonContractData: IContractJson) => {
                this.contractAddressTeamManager = jsonContractData.networks[configNet.netId].address;
                let contractTeamManager = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressTeamManager);
                this.log.d("TruffleContractTeamManager function: ", contractTeamManager);
                this.log.d("ContractAddressTeamManager: ", this.contractAddressTeamManager);
                return contractTeamManager;
            });
        contractPromises.push(promTeamManager);
        let promBBFactory = this.http.get(AppConfig.BB_FACTORY_CONTRACT_PATH).toPromise()
            .then((jsonContractData: IContractJson) => {
                this.contractAddressBbFactory = jsonContractData.networks[configNet.netId].address;
                let contractBBFactory = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressBbFactory);
                this.log.d("TruffleContractBBFactory function: ", contractBBFactory);
                this.log.d("ContractAddressBBFactory: ", this.contractAddressBbFactory);
                return contractBBFactory;
            });
        contractPromises.push(promBBFactory);
        return this.initProm = Promise.all(contractPromises);
    }

    public setBaseContracts(teamUid): Promise<ITrbSmartContact[]> {
        let teamManagerContract;
        let bbFactoryContract;
        return this.initProm.then(([bright, commit, root, teamManager, bbFactory]) => {
            teamManagerContract = teamManager;
            bbFactoryContract = bbFactory;
            return this.getTeamContractAddresses(teamUid);
        })
        .then((contractAddresses: Array<string>) => {
            this.setCurrentTeam(teamUid);
            let contractBright = new this.web3.eth.Contract(this.contractJsonBright.abi, contractAddresses[0]);
            this.contractAddressBright = contractAddresses[0];
            let contractCommits = new this.web3.eth.Contract(this.contractJsonCommits.abi, contractAddresses[1]);
            this.contractAddressCommits = contractAddresses[1];
            let contractRoot = new this.web3.eth.Contract(this.contractJsonRoot.abi, contractAddresses[3]);
            this.contractAddressRoot = contractAddresses[3];
            this.initProm = Promise.all([contractBright, contractCommits, contractRoot, teamManagerContract, bbFactoryContract]);
            return this.initProm;
        });
    }

    public isCurrentUserAdmin(): Promise<boolean>{
        let teamManagerContract;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            return teamManagerContract.methods.getUserType(this.currentTeamUid, this.currentUser.address).call();
        })
        .then(userType => {
            return parseInt(userType) === AppConfig.UserType.Admin;
        });
    }

    public getInvitedUsersInfo(): Promise<Array<InvitedUser>> {
        let teamManagerContract;
        let invitedEmails;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            return teamManagerContract.methods.getInvitedEmailsPageCount(this.currentTeamUid).call();
        })
        .then((blockPositions: number) => {
            let promises = new Array<Promise<Array<String>>>();
            for(let i = 0; i <= blockPositions; i++){
                promises.push(teamManagerContract.methods.getInvitedUsersList(this.currentTeamUid, i).call());
            }
            return Promise.all(promises);
        })
        .then((invitedUsersEmails: Array<Array<string>>) => {
            invitedEmails = invitedUsersEmails.map(emails => Object.keys(emails)
            .map(key => emails[key]));
            invitedEmails = invitedEmails = invitedEmails.reduce((acc, val) => acc.concat(val.filter(email => !!email)), []);
            let promises = invitedEmails.map(email => {
                return teamManagerContract.methods.getInvitedUserInfo(email, this.currentTeamUid).call();
            });
            return Promise.all(promises);
        })
        .then(invitedUserInfo => {
            let invitedUsers = invitedUserInfo.map((userInfo: Array<string>, i: number) => {
                const decodeEmail = EncryptionUtils.decode(invitedEmails[i]);
                return new InvitedUser(decodeEmail, parseInt(userInfo[1]), parseInt(userInfo[2]));
            });

            return invitedUsers;
        });
    }

    public getTeamMembersInfo(): Promise<Array<Array<TeamMember>>> {
        let teamManagerContract;
        let teamMembers = new Array<Array<TeamMember>>(); 
        teamMembers[0] = new Array<TeamMember>();
        teamMembers[1] = new Array<TeamMember>();
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            return teamManagerContract.methods.getTeamMembers(this.currentTeamUid).call();
        })
        .then((memberAddresses: Array<Array<string>>) => {
            let adminPromises;
            let memberPromises;
            adminPromises = memberAddresses[0].map((memberAddress: string) => {
                teamMembers[0].push(new TeamMember(memberAddress));
                return teamManagerContract.methods.getUserInfo(this.currentTeamUid, memberAddress).call();
            });
            memberPromises = memberAddresses[1].map(memberAddress => {
                teamMembers[1].push(new TeamMember(memberAddress));
                return teamManagerContract.methods.getUserInfo(this.currentTeamUid, memberAddress).call();
            });
            return Promise.all([Promise.all(adminPromises), Promise.all(memberPromises)]);
        })
        .then((membersInfo: Array<Array<any>>) => {
            for (let i = 0; i < membersInfo.length; i++){
                for (let j = 0; j < membersInfo[i].length; j++){
                    teamMembers[i][j].email = EncryptionUtils.decode(membersInfo[i][j][2]);
                    teamMembers[i][j].userType = membersInfo[i][j][1];
                }
            } 
            return teamMembers;
        });
    }

    public getUserEmail(teamUid: number, memberAddress: string): Promise<string> {
        let teamManagerContract;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            return teamManagerContract.methods.getUserInfo(teamUid, memberAddress).call();
        }).then((userInfo: Array<string>) => {
            return EncryptionUtils.decode(userInfo[2]);
        });
    }

    public getAllTeamInvitationsByEmail(email: string): Promise<Array<number>> {
        let teamManagerContract;
        let teamInvitations: Array<number>;
        const encodeEmail = EncryptionUtils.encode(email);
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            return teamManagerContract.methods.getAllTeamInvitationsByEmail(encodeEmail).call();
        }).then((teamUidInvitations: Array<string>) => {
            teamInvitations =  teamUidInvitations
            .map(teamUid => parseInt(teamUid))
            .filter(teamUid => teamUid !== 0);
            let promises = teamInvitations.map(teamUid => teamManagerContract.methods.getInvitedUserInfo(encodeEmail, teamUid).call());
            return Promise.all(promises);
        })
        .then((teamUidInvitationsInfo: Array<string>) => {
            for (let i = 0; i < teamInvitations.length; i++){
                let exp = parseInt(teamUidInvitationsInfo[i][1]);
                if (exp < Date.now() / AppConfig.SECS_TO_MS) {
                    teamInvitations.splice(i, 1);
                }
            }
            return teamInvitations;
        });
    }

    public removeTeamMember(memberAddress: string): Promise<void | TransactionReceipt> {
        let teamManagerContract;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            let byteCodeData = teamManagerContract.methods.removeFromTeam(this.currentTeamUid, memberAddress).encodeABI();
            return this.sendTx(byteCodeData, this.contractAddressTeamManager);
        });
    }

    public isInvitedToTeam(email: string): Promise<boolean> {
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            const encodeEmail = EncryptionUtils.encode(email);
            return teamManager.methods.isUserEmailInvited(encodeEmail).call();
        });
    }

    public inviteToCurrentTeam(emails: Array<string>, userType: AppConfig.UserType): Promise<void | TransactionReceipt> {
        let teamManagerContract;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            return this.inviteMultipleEmailsToTeam(this.currentTeamUid, emails, userType, AppConfig.DEFAULT_INVITATION_EXP_IN_SECS);
        });
    }

    public inviteEmailToTeam(
        teamUid: number, email: string, 
        userType: AppConfig.UserType, expInSecs: number): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            const encodeEmail = EncryptionUtils.encode(email);
            let byteCodeData = teamManager.methods.inviteToTeam(teamUid, encodeEmail, userType as number, expInSecs).encodeABI();
            return this.sendTx(byteCodeData, this.contractAddressTeamManager);
        });
    }

    public inviteMultipleEmailsToTeam(teamUid: number, emails: Array<string>, userType: AppConfig.UserType, expInSecs: number) {
        return this.sendEmailInvitations(emails).then(res => {
            this.log.d("The users email invitations have been send");
            return this.initProm;
        }).then(([bright, commit, root, teamManager]) => {
            return emails.reduce(
            (prevVal, email) => {
                return prevVal.then(() => {
                    let encodeEmail = EncryptionUtils.encode(email);
                    let byteCodeData = teamManager.methods.inviteToTeam(teamUid, encodeEmail, userType as number, expInSecs).encodeABI();
                    return this.sendTx(byteCodeData, this.contractAddressTeamManager);
                });
            },
            Promise.resolve());
        });
    }

    public sendEmailInvitations(emails: Array<string>): Promise<void> {
        let promises = emails.map(email => this.http.post(AppConfig.TEAM_API + email + AppConfig.INVITATION_PATH, {}).toPromise());
        return Promise.all(promises)
        .then(result => this.log.d("The email invitations have been send"))
        .catch(e => this.log.e("Error sending the invitation via email"));
    }

    public removeInvitation(email: string): Promise<void | TransactionReceipt> {
        let teamManagerContract;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            let encodeEmail = EncryptionUtils.encode(email);
            let byteCodeData = teamManagerContract.methods.removeInvitationToTeam(this.currentTeamUid, encodeEmail).encodeABI();
            return this.sendTx(byteCodeData, this.contractAddressTeamManager);
        });
    }

    public getUserTeam(): Promise<Array<number>> {
        let promise;
        if (this.teamUids) {
            promise = new Promise(resolve => resolve(this.teamUids));
        } else {
            promise = this.initProm.then(([bright, commit, root, teamManager]) => {
                return teamManager.methods.getUserTeam(this.currentUser.address).call();
            })
            .then((teamUidStr: Array<string>) => {
                return teamUidStr.map(teamUid => parseInt(teamUid));
            });
        }
        return promise;
    }

    public registerToTeam(email: string, teamUid: number): Promise<number> {
        let teamManagerContract;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            const encodeEmail = EncryptionUtils.encode(email);
            let byteCodeData =  teamManager.methods.registerToTeam(this.currentUser.address, encodeEmail, teamUid).encodeABI();
            return this.sendTx(byteCodeData, this.contractAddressTeamManager);
        })
        .then(() => {
            return this.getUserTeam();
        })
        .then((teamUids: Array<number>) => {
            return teamUids[teamUids.length - 1];
        });
    }

    public createTeam(email: string, teamName: string, seasonLength: number): Promise<number> {
        let teamManagerContract;
        let teamUid;
        const encodeEmail = EncryptionUtils.encode(email);
        const encodeTeamName = EncryptionUtils.encode(teamName);
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            let byteCodeData =  teamManager.methods.createTeam(encodeEmail, encodeTeamName).encodeABI();
            return this.sendTx(byteCodeData, this.contractAddressTeamManager);
        })
        .then(() => {
            return this.getUserTeam();
        })
        .then((teamUids: Array<number>) => {
            teamUid = teamUids[teamUids.length - 1];
            return teamManagerContract.methods.getTeamMembers(teamUid).call();
        })
        .then((members: any) => {
            return this.deployAllContracts(encodeEmail, teamUid, seasonLength);
        })
        .then(() => {
            return teamUid;
        });
    }

    public deployAllContracts(email: string, teamUId: number, seasonLength: number): Promise<void | TransactionReceipt | Array<string>> {
        let teamManagerContract;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            let byteCodeData = teamManagerContract.methods.deployBright(teamUId).encodeABI();
            return this.sendTx(byteCodeData, this.contractAddressTeamManager);
        })
        .then(() => {
            let byteCodeData = teamManagerContract.methods.deployCommits(teamUId).encodeABI();
            return this.sendTx(byteCodeData, this.contractAddressTeamManager);
        })
        .then(() => {
            let byteCodeData = teamManagerContract.methods.deployThreshold(teamUId).encodeABI();
            return this.sendTx(byteCodeData, this.contractAddressTeamManager);
        })
        .then(() => {
            let byteCodeData = teamManagerContract.methods.deployRoot(email, teamUId, seasonLength).encodeABI();
            return this.sendTx(byteCodeData, this.contractAddressTeamManager);
        })
        .then(() => {
            return this.getTeamContractAddresses(teamUId);
        });
    }

    public getTeamContractAddresses(teamUId: number): Promise<void | TransactionReceipt | Array<string>> {
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            return teamManager.methods.getTeamContractAddresses(teamUId).call({ from: this.currentUser.address });
        });
    }

    public getTeamName(teamUid: number): Promise<string> {
        let teamManagerContract;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            return teamManagerContract.methods.getTeamName(teamUid).call();
        }).then(teamName => EncryptionUtils.decode(teamName));
    }

    public getCurrentTeamName(): Promise<string> {
        return this.getTeamName(this.currentTeamUid);
    }

    public changeTeamName(teamName: string): Promise<void | TransactionReceipt> {
        let teamManagerContract;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            const encodeTeamName = EncryptionUtils.encode(teamName);
            let byteCodeData = teamManagerContract.methods.setTeamName(this.currentTeamUid, encodeTeamName).encodeABI();
            return this.sendTx(byteCodeData, this.contractAddressTeamManager);
        });
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
        return this.initProm.then(([bright]) => {
            contractArtifact = bright;
            this.log.d("Setting profile with name and mail: ", [name, mail]);
            const encodeName = EncryptionUtils.encode(name);
            const encodeEmail = EncryptionUtils.encode(mail);
            let bytecodeData = contractArtifact.methods.setProfile(encodeName, encodeEmail).encodeABI();
            this.log.d("Bytecode data: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressBright);
        })
        .catch(e => {
            this.log.e("Error setting profile: ", e);
            throw e;
        });
    }

    public addCommit(url: string, title: string, usersMail: Array<string>): Promise<any> {
        let rootContract;
        let teamManagerContract;
        let project = FormatUtils.getProjectFromUrl(url);
        const encodedProject = EncryptionUtils.encode(project);
        const encodeUrl = EncryptionUtils.encode(url);
        const encodeTitle = EncryptionUtils.encode(title);
        let isAlreadyUploaded = false;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            rootContract = root;
            teamManagerContract = teamManager;
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
                encodeTitle,
                encodeUrl,
                numUsers
            ).encodeABI();
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressCommits);
        }).then(() => {
            isAlreadyUploaded = true;
            let emailsArray = usersMail.filter(email => !!email).map(email => 
                this.web3.utils.keccak256(EncryptionUtils.encode(email))
            );
            let bytecodeData = rootContract.methods.notifyCommit(
                encodeUrl,
                emailsArray
            ).encodeABI();
            this.log.d("ByteCodeData of notifyCommit: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressRoot);
        }).then(() => {
            let bytecodeData = teamManagerContract.methods.addProject(
                this.currentTeamUid,
                encodedProject
            ).encodeABI();
            this.log.d("ByteCodeData of notifyCommit: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressTeamManager);
        }).catch(e => {
            if (isAlreadyUploaded) {
                this.deleteCommit(encodeUrl);
            }
            this.log.e("Error in addcommit: ", e);
            throw e;
        });
    }

    public getAllProjects(): Promise<Array<string>> {
        let teamManagerContract;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            return teamManagerContract.methods.getProjectPageCount(this.currentTeamUid).call({from: this.currentUser.address});
        })
        .then((blockPositions: number) => {
            let promises = new Array<Promise<Array<string>>>();
            for(let i = 0; i <= blockPositions; i++){
                promises.push(teamManagerContract.methods.getAllProjects(this.currentTeamUid, i).call({from: this.currentUser.address}));
            }
            return Promise.all(promises);
        })
        .then((allProjects: Array<Array<string>>) => {
            let projects = new Array<string>();
            allProjects.forEach((projs: Array<string>) => {
                let decodedProjs = Object.keys(projs)
                .map(key => projs[key])
                .map((proj: string) => EncryptionUtils.decode(proj))
                .filter((proj: string) => proj !== "");
                projects = projects.concat(decodedProjs);
            });
            return projects;
        });
    }

    public deleteCommit(url: string): Promise<any> {
        let contractArtifact;
        return this.initProm.then(([bright]) => {
            contractArtifact = bright;
            this.log.d("Request to delete the commit: " + url);
            const encodeUrl = EncryptionUtils.encode(url);
            let urlKeccak = this.web3.utils.keccak256(encodeUrl);
            let bytecodeData = contractArtifact.methods.removeUserCommit(urlKeccak).encodeABI();
            this.log.d("Bytecode data: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressBright);
        }).catch(e => {
            this.log.e("Error deleting a commit: ", e);
            throw e;
        });
    }

    public getCommits(): Promise<Array<UserCommit>> {
        return this.getCurrentSeasonState()
        .then((seasonState: UserSeasonState) => {
            let batchCommits = new Array<string>();
            return this.getBatchCommits(seasonState.seasonCommits, 0, batchCommits);
        }).then((allUserCommits: Array<string>) => {
            let promisesPending = allUserCommits.map(userCommit => this.getUserCommitDetails(userCommit));
            return Promise.all(promisesPending);
        }).catch(err => {
            this.log.e("Error obtaining user commits :", err);
            throw err;
        });
    }

    public getCommitsToReview(): Promise<Array<Array<UserCommit>>> {
        let endIndex: number;
        return this.getCurrentSeasonState().then((seasonState: UserSeasonState) => {
            let pendingReviews = seasonState.pendingReviews;
            let finishedReviews = seasonState.finishedReviews;
            endIndex = (pendingReviews > finishedReviews) ? pendingReviews : finishedReviews;
            return this.initProm;
        }).then(([bright]) => {
            let currentSeason = this.storageSrv.get(AppConfig.StorageKey.CURRENTSEASONINDEX);
            return bright.methods.getUserSeasonCommits(this.currentUser.address, currentSeason, 0, endIndex)
            .call({ from: this.currentUser.address})
                .then((allUserCommits: Array<any>) => {
                    let promisesPending = allUserCommits[0].map(userCommit => this.getUserCommitDetails(userCommit));
                    let promisesFinished = allUserCommits[1].map(userCommit => this.getUserCommitDetails(userCommit, false));
                    return Promise.all([Promise.all(promisesPending), Promise.all(promisesFinished)]);
                });
        }).catch(err => {
            this.log.e("Error obtaining commits to review :", err);
            throw err;
        });
    }

    public getCurrentSeasonState(): Promise<UserSeasonState> {
        let brightContract;
        return this.initProm
        .then(([bright]) => {
            brightContract = bright;
            return bright.methods.getCurrentSeason().call({ from: this.currentUser.address});
        }).then(seasonData => {
            let currentSeason = seasonData[0];
            this.storageSrv.set(AppConfig.StorageKey.CURRENTSEASONINDEX, currentSeason);
            return brightContract.methods.getUserSeasonState(this.currentUser.address, currentSeason)
                .call({ from: this.currentUser.address});
        }).then(seasonState => {
            let arrayState =  Object.keys(seasonState)
            .map(key => parseInt(seasonState[key]));
            return UserSeasonState.fromSmartContract(arrayState);
        }).catch(err => {
            this.log.e("Error obtaining the state of the user commmits:", err);
            throw err;
        });
    }

    public getReviewCommitsState(): Promise<Array<number>> {
        return this.getCurrentSeasonState().then((seasonState: UserSeasonState) => {
            return [seasonState.pendingReviews, seasonState.finishedReviews, seasonState.totalReviews];
        });
    }

    public getSeasonCommitsToReview(endIndex: number): Promise<Array<Array<UserCommit>>> {
        return this.initProm
            .then(([bright, commit]) => {
                return bright.methods.getCurrentSeason().call({ from: this.currentUser.address})
                .then(seasonData => {
                    let startIndex = endIndex - AppConfig.COMMITS_BLOCK_SIZE;
                    startIndex = startIndex < 0 ? 0 : startIndex;
                    return bright.methods.getUserSeasonCommits(this.currentUser.address, seasonData[0], startIndex, endIndex)
                    .call({ from: this.currentUser.address});
                }).then((allUserCommits: Array<any>) => {
                    let promisesAllReviews = allUserCommits[4].map(userCommit =>  this.getUserCommitDetails(userCommit));
                    let promisesPending = allUserCommits[0].map(userCommit =>  this.getUserCommitDetails(userCommit));
                    let promisesFinished = allUserCommits[1].map(userCommit =>  this.getUserCommitDetails(userCommit, false));
                    return Promise.all([Promise.all(promisesPending), Promise.all(promisesFinished), Promise.all(promisesAllReviews)]);
                });
            }).catch(err => {
                this.log.e("Error obtaining commits to review :", err);
                throw err;
            });
    }

    public getAllUserAddresses(): Promise<Array<string>> {
        return this.initProm
            .then(([bright]) => {
                return bright.methods.getUsersAddress().call({ from: this.currentUser.address });
            }).catch(err => {
                this.log.e("Error checking commit season :", err);
                throw err;
            });
    }

    public checkCommitCurrentSeason(url: string, author: string): Promise<boolean> {
        let rootContract;
        let urlKeccak;
        return this.initProm
            .then(([root]) => {
                rootContract = root;
                urlKeccak = this.web3.utils.keccak256(url);
                return rootContract.methods.checkCommitSeason(urlKeccak, author).call();
            }).catch(err => {
                this.log.e("Error checking commit season :", err);
                throw err;
            });
    }

    public getCommitDetails(url: string, returnsUserCommits = true): Promise<UserCommit | CommitDetails> {
        return this.initProm.then(([bright, commit]) => {
            const encodeUrl = EncryptionUtils.encode(url);
            return commit.methods.getDetailsCommits(this.web3.utils.keccak256(encodeUrl)).call({ from: this.currentUser.address})
                .then((commitVals: any) => {
                    let result = returnsUserCommits ? 
                        UserCommit.fromSmartContract(commitVals, false) : CommitDetails.fromSmartContract(commitVals);
                    return result;
                });
        }).catch(err => {
            this.log.e("Error getting commit details :", err);
            throw err;
        });
    }

    public setReview(url: string, text: string, points: Array<number>): Promise<any> {
        return this.initProm.then(([bright, commit, root]) => {
            let contractArtifact = commit;
            const encodeUrl = EncryptionUtils.encode(url);
            const encodeText = EncryptionUtils.encode(text);
            let bytecodeData = contractArtifact.methods.setReview(encodeUrl, encodeText, points).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("Introduced text: ", text);
            this.log.d("Introduced points: ", points);
            return this.sendTx(bytecodeData, this.contractAddressCommits);
        }).catch(e => {
            this.log.e("Error setting a review: ", e);
            throw e;
        });

    }

    public getCommentsOfCommit(url: string): Promise<Array<CommitComment>> {
        return this.initProm.then(([bright, commit]) => {
            const encodeUrl = EncryptionUtils.encode(url);
            let urlKeccak = this.web3.utils.keccak256(encodeUrl);
            return commit.methods.getCommentsOfCommit(urlKeccak).call({ from: this.currentUser.address})
                .then((allComments: Array<any>) => {
                    let promisesFinished = allComments[1].map(comment => commit.methods.getCommentDetail(urlKeccak, comment)
                    .call({ from: this.currentUser.address})
                        .then((commitVals: any) => {
                            return Promise.all([commitVals, bright.methods.getUserName(commitVals[4])
                            .call({ from: this.currentUser.address})]);
                        }).then((data) => {
                            return CommitComment.fromSmartContract(data[0], data[1]);
                        }));
                    return Promise.all(promisesFinished);
                });
        }).catch(err => {
            this.log.e("Error getting comments of commit :", err);
            throw err;
        });
    }
    
    public getCommitScores(url: string): Promise<Array<number>> {
        return this.initProm.then(([bright, commit]) => {
            const encodeUrl = EncryptionUtils.encode(url);
            let urlKeccak = this.web3.utils.keccak256(encodeUrl);
            return commit.methods.getCommitScores(urlKeccak).call({ from: this.currentUser.address});
        }).catch(err => {
            this.log.e("Error getting comments of commit :", err);
            throw err;
        });
    }

    public getUserDetails(hash: string): Promise<UserDetails> {
        return this.userCacheSrv.getUser(hash).catch(() => {
            return this.initProm.then(([bright]) => {
                return bright.methods.getUser(hash).call({ from: this.currentUser.address });
            }).then((userVals: Array<any>) => {
                let userValsToUSerDetails = UserDetails.fromSmartContract(userVals);
                this.userCacheSrv.set(hash, userValsToUSerDetails);
                return userValsToUSerDetails;
            }).catch(err => {
                this.log.e("Error getting user details :", err);
                throw err;
            });
        });
    }

    public getCurrentSeasonThreshold(): Promise<Array<number>> {
        return this.initProm.then(([bright, commit, root]) => {
            return root.methods.getCurrentSeasonThreshold().call({ from: this.currentUser.address});
        }).catch(e => {
            this.log.e("Error getting current season threshold: ", e);
            throw e;
        });
    }

    public getSeasonThreshold(seasonIndex: number): Promise<Array<number>> {
        return this.initProm.then(([bright, commit, root]) => {
            return root.methods.getSeasonThreshold(seasonIndex).call({ from: this.currentUser.address});
        }).catch(e => {
            this.log.e("Error getting season threshold: ", e);
            throw e;
        });
    }

    public passToNewSeasonAndSetThresholds(seasonIndex: number, commitThreshold: number, reviewThreshold: number): Promise<any> {
        let brightContract;
        let teamManagerContract;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            brightContract = bright;
            teamManagerContract = teamManager;
            let tx =  bright.methods.checkSeason().encodeABI();
            return this.sendTx(tx, this.contractAddressBright);
        }).then(() => {
            let tx = brightContract.methods.setSeasonThresholds(seasonIndex, commitThreshold, reviewThreshold).encodeABI();
            return this.sendTx(tx, this.contractAddressBright);
        })
        .then(() => {
            let tx = teamManagerContract.methods.clearAllProjects(this.currentTeamUid).encodeABI();
            return this.sendTx(tx, this.contractAddressTeamManager);
        }).catch(e => {
            this.log.e("Error getting season threshold: ", e);
            throw e;
        });
    }

    public setCurrentSeasonThreshold(commitThreshold: number, reviewThreshold: number): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright, commit, root]) => {
            let bytecodeData =  root.methods.setCurrentSeasonThresholdOwner(commitThreshold, reviewThreshold).encodeABI();
            return this.sendTx(bytecodeData, this.contractAddressRoot);
        }).catch(e => {
            this.log.e("Error setting new thresold: ", e);
            throw e;
        });
    }
   

    public setThumbReviewForComment(url: string, index: number, value: number): Promise<any> {
        return this.initProm.then(([bright, commit, root]) => {
            return this.getCommentsOfCommit(url)
                .then((arrayOfComments: Array<CommitComment>) => {
                    const encodeUrl = EncryptionUtils.encode(url);
                    let bytecodeData = root.methods.setVote(encodeUrl, arrayOfComments[index].user, value).encodeABI();
                    this.log.d("Introduced value: ", value);
                    return this.sendTx(bytecodeData, this.contractAddressRoot);
                });
        }).catch(e => {
            this.log.e("Error setting thumbs: ", e);
            throw e;
        });
    }

    public setSeasonLength(seasonLength: number): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright, commit, root]) => {
            let bytecodeData = root.methods.setSeasonLength(seasonLength).encodeABI();
            return this.sendTx(bytecodeData, this.contractAddressRoot);
        }).catch(e => {
            this.log.e("Error setting the new season length: ", e);
            throw e;
        });
    }

    public reviewChangesCommitFlag(url: string) {
        return this.initProm.then(([bright, commit, root]) => {
            const encodeUrl = EncryptionUtils.encode(url);
            let bytecodeData = root.methods.readCommit(encodeUrl).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressRoot);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
    }

    public getAllUserReputation(season: number, global: boolean): Promise<Array<UserReputation>> {
        let contractArtifact;
        return this.initProm.then(([bright]) => {
            contractArtifact = bright;
            return contractArtifact.methods.getUsersAddress().call({ from: this.currentUser.address});
        }).then((usersAddress: Array<string>) => {
            let numberUsers = usersAddress.length;
            this.log.d("Number of users: ", numberUsers);
            let promises = usersAddress.map(userAddress => {
                let promise: Promise<any>;
                if (global) {
                    promise = contractArtifact.methods.getUser(userAddress).call({ from: this.currentUser.address })
                        .then((userVals: Array<any>) => UserReputation.fromSmartContractGlobalReputation(userVals));
                } else {
                    promise = contractArtifact.methods.getUserSeasonReputation(userAddress, season)
                    .call({ from: this.currentUser.address })
                        .then((userVals: Array<any>) => {
                            return UserReputation.fromSmartContract(userVals);
                        });
                }
                return promise;
            });
            return Promise.all(promises);
        }).catch(err => {
            this.log.e("Error getting ranking: ", err);
            throw err;
        });
    }

    public getCurrentSeason(): Promise<Array<number>> {
        return this.initProm.then(([bright]) => {
            return bright.methods.getCurrentSeason().call({ from: this.currentUser.address});
        }).then(seasonState => {
            this.storageSrv.set(AppConfig.StorageKey.CURRENTSEASONINDEX, seasonState[0]);
            return seasonState;
        }).catch(err => {
            this.log.e("Error getting current season :", err);
            throw err;
        });
    }

    public getFeedback(url: string): Promise<boolean> {
        const encodeUrl = EncryptionUtils.encode(url);
        let urlKeccak = this.web3.utils.keccak256(encodeUrl);
        return this.initProm.then(contract => {
            let promise = contract[0].methods.getFeedback(urlKeccak).call({ from: this.currentUser.address});
            return promise;
        }).catch(err => {
            this.log.e("Error getting urls (Feedback) :", err);
            throw err;
        });
    }

    public setFeedback(url: string) {
        return this.initProm.then(([bright, commit, root]) => {
            const encodeUrl = EncryptionUtils.encode(url);
            let bytecodeData = root.methods.setFeedback(encodeUrl, this.currentUser.address).encodeABI();
            this.log.d("Introduced url: ", url);
            return this.sendTx(bytecodeData, this.contractAddressRoot);
        }).catch(e => {
            this.log.e("Error setting feedback: ", e);
            throw e;
        });
    }

    public getReviewers(url: string): Promise<Array<Array<string>>> {
        return this.initProm.then(([bright, commit]) => {
            const encodeUrl = EncryptionUtils.encode(url);
            let urlKeccak = this.web3.utils.keccak256(encodeUrl);
            return commit.methods.getCommentsOfCommit(urlKeccak).call({ from: this.currentUser.address});
        }).catch(err => {
            this.log.e("Error getting commit reviewers :", err);
            throw err;
        });
    }

    public getReviewersName(url: string): Promise<Array<Array<UserDetails>>> {

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

    public setUserName(name: string): Promise<any> {
        return this.initProm.then(([bright]) => {
            const encodeName = EncryptionUtils.encode(name);
            let bytecodeData = bright.methods.setUserName(encodeName).encodeABI();
            return this.sendTx(bytecodeData, this.contractAddressBright);
        }).then(() => {
            this.userCacheSrv.setUserName(this.currentUser.address, name);
        }).catch(e => {
            this.log.e("Error setting new user name: ", e);
            throw e;
        });
    }

    public getContracts(): Promise<Array<ITrbSmartContact>> {
        return this.initProm;
    }

    public getAddresses(): Array<string> {
        return ([this.contractAddressRoot, this.contractAddressBright, this.contractAddressCommits]);
    }

    public getCurrentTeam(): number {
        return this.currentTeamUid;
    }

    public sendTx(bytecodeData, contractAddress): Promise<void | TransactionReceipt> { //PromiEvent<TransactionReceipt>
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

    private getBatchCommits(totalNumberOfCommits: number, startIndex: number, allCommits: Array<string>): Promise<Array<string>> {
        let endIndex = startIndex + AppConfig.COMMITS_BLOCK_SIZE;
        return this.initProm.then(([bright]) => {
            let currentSeason = this.storageSrv.get(AppConfig.StorageKey.CURRENTSEASONINDEX);
            return bright.methods.getUserSeasonCommits(this.currentUser.address, currentSeason, startIndex, endIndex)
                .call({ from: this.currentUser.address});
        }).then((allUserCommits: Array<any>) => {
            let userCommits = allUserCommits[2].filter(commit => commit !== AppConfig.EMPTY_COMMIT_HASH);
            allCommits = allCommits.concat(userCommits);
            let batchLenght = allCommits.length;
            return (totalNumberOfCommits > batchLenght) ? this.getBatchCommits(totalNumberOfCommits, endIndex, allCommits) : allCommits;
        }).catch(err => {
            this.log.e("Error obtaining user commits :", err);
            throw err;
        });
    }

    private getUserCommitDetails(url: string, isPending = true): Promise<UserCommit> {
        return this.initProm.then(([bright, commit]) => {
            return commit.methods.getDetailsCommits(url).call({ from: this.currentUser.address})
                .then((commitVals: any) => {
                    return UserCommit.fromSmartContract(commitVals, isPending);
                });
        }).catch(err => {
            this.log.e("Error getting commit details :", err);
            throw err;
        });
    }

    private setCurrentTeam(teamUid: number) {
        this.currentTeamUid = teamUid;
    }
}
