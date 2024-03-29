import { Injectable } from "@angular/core";
import { default as Web3 } from "web3";
import { Web3Service } from "../core/web3.service";
import { ILogger, LoggerService } from "../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { TransactionReceipt } from "web3-core";
import { Account } from "web3-eth-accounts";
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
import { MemberVersion } from "../models/member-version.model";
import { EncryptionUtils } from "../core/encryption-utils";
import { FormatUtils } from "../core/format-utils";
import { TransactionExecutorService } from "./transaction-executor.service";

interface IContractJson {
    abi: Array<Object>;
    networks: Array<any>;
}

interface ITrbSmartContact { //Web3.Eth.Contract
    [key: string]: any;
}

@Injectable()
export class ContractManagerService {

    private readonly MINIMUM_DELAY_MILIS = 10;
    private readonly MAXIMUM_DELAY_MILIS = 1250;
    private readonly RECURSIVE_METHODS_MAX_ITERATIONS = 30;
    private readonly MAX_LENGTH_BYTES32 = /.{1,16}/g;

    private contractAddressRoot: string;
    private contractAddressBright: string;
    private contractAddressCommits: string;
    private contractAddressTeamManager: string;
    private contractAddressBbFactory: string;
    private contractAddressBrightDictionary: string;
    private contractAddressProxyManager: string;

    private contractJsonRoot: IContractJson;
    private contractJsonBright: IContractJson;
    private contractJsonCommits: IContractJson;
    private contractJsonTeamManager: IContractJson;

    private log: ILogger;
    private web3: Web3;
    private initProm: Promise<Array<ITrbSmartContact>>;
    private currentUser: Account;
    private teamUids: Array<number>;
    private currentTeamUid: number;
    private pendingReviews: number;

    constructor(
        private http: HttpClient,
        private userCacheSrv: UserCacheService,
        private storageSrv: LocalStorageService,
        private transactionQueueSrv: TransactionExecutorService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ContractManagerService");
    }

    public init(account: Account, cont: number): Promise<Array<ITrbSmartContact>> {
        AppConfig.CURRENT_NODE_INDEX = cont;
        let configNet = AppConfig.NETWORK_CONFIG[cont];
        this.log.d("Initializing service with user ",  AppConfig.NETWORK_CONFIG[cont]);
        let contractPromises = new Array<Promise<ITrbSmartContact>>();
        return Web3Service.getWeb3()
        .then(res => {
            this.web3 = res;
            this.currentUser = account;
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
                    this.contractJsonTeamManager = jsonContractData;
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
            let promDictionary = this.http.get(AppConfig.BB_DICTIONARY_CONTRACT_PATH).toPromise()
                .then((jsonContractData: IContractJson) => {
                    this.contractAddressBrightDictionary = jsonContractData.networks[configNet.netId].address;
                    let contractBrightDictionaty = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressBrightDictionary);
                    this.log.d("TruffleContractBrightDictionaty function: ", contractBrightDictionaty);
                    this.log.d("ContractAddressBrightDictionary: ", this.contractAddressBrightDictionary);
                    return contractBrightDictionaty;
                });
            contractPromises.push(promDictionary);
            let promProxyManager = this.http.get(AppConfig.BB_PROXY_CONTRACT_PATH).toPromise()
                .then((jsonContractData: IContractJson) => {
                    this.contractAddressProxyManager = jsonContractData.networks[configNet.netId].address;
                    let contractProxyManager = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressProxyManager);
                    this.log.d("TruffleContractProxyManager function: ", contractProxyManager);
                    this.log.d("ContractAddressProxyManager: ", this.contractAddressProxyManager);
                    return contractProxyManager;
                });
            contractPromises.push(promProxyManager);
            this.initProm = Promise.all(contractPromises);
            return this.initProm;
        }).catch(error => {
            this.log.w("Contract manager could not start, error: ", error);
            throw error;
        });
    }

    public getUserAccount(text: string, pass: string): Account {
        const web3: Web3 = Web3Service.getStaticWeb3();
        return web3.eth.accounts.decrypt(text, pass);
    }

    public setBaseContracts(teamUid: number, version?: number): Promise<Array<ITrbSmartContact>> {
        let teamManagerContract: ITrbSmartContact;
        let bbFactoryContract: ITrbSmartContact;
        let brightDictionaryContract: ITrbSmartContact;
        let managerContract: ITrbSmartContact;
        this.log.d("Setting base contracts for team: ", teamUid);
        let promise = version ? this.setTeamVersionManager(version) : this.initProm;
        return promise
        .then(([bright, commit, root, teamManager, bbFactory, brightDictionary, proxyManager]) => {
            teamManagerContract = teamManager;
            bbFactoryContract = bbFactory;
            brightDictionaryContract = brightDictionary;
            managerContract = proxyManager;
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
            this.initProm = Promise.all(
                [contractBright, contractCommits, contractRoot, 
                teamManagerContract, bbFactoryContract, brightDictionaryContract, managerContract]
            );
            return this.initProm;
        });
    }

    public isCurrentUserAdmin(): Promise<boolean> {
        let teamManagerContract: ITrbSmartContact;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            return teamManagerContract.methods.getUserType(this.currentTeamUid, this.currentUser.address)
            .call({ from: this.currentUser.address});
        })
        .then(userType => {
            return parseInt(userType) === AppConfig.UserType.Admin;
        });
    }

    public getInvitedUsersInfo(): Promise<Array<InvitedUser>> {
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            return teamManager.methods.getInvitedUsersList(this.currentTeamUid).call({ from: this.currentUser.address});
        })
        .then((invitedUsersEmails: Array<string>) => {
            let promises = invitedUsersEmails.map(email => {
                return this.getInvitedUserInfo(email, this.currentTeamUid);
            });
            return Promise.all(promises);
        });
    }

    public getTeamMembersInfo(): Promise<Array<Array<TeamMember>>> {
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            return teamManager.methods.getTeamMembers(this.currentTeamUid).call({ from: this.currentUser.address});
        })
        .then((memberAddresses: Array<Array<string>>) => {
            let adminPromises = memberAddresses[0].map((memberAddress: string) => {
                return this.getTeamMemberInfo(this.currentTeamUid, memberAddress);
            });
            let memberPromises = memberAddresses[1].map((memberAddress: string) => {
                return this.getTeamMemberInfo(this.currentTeamUid, memberAddress);
            });
            return Promise.all([Promise.all(adminPromises), Promise.all(memberPromises)]);
        });
    }

    public getVersionUserEmail(teamUid: number, memberAddress: string, version: number): Promise<string> {
        return this.initProm.then(([bright, commit, root, teamManager, bbFactory, brightDictionary, proxyManager]) => {
            return proxyManager.methods.getUserInfo(version, teamUid, memberAddress).call({ from: memberAddress });
        }).then((userInfo: Array<string>) => {
            return this.getValueFromContract(userInfo[1]);
        }).then(emailValue => {
            return emailValue ? EncryptionUtils.decode(emailValue) : "";
        }).catch(e => {
            this.log.e("Error getting user email");
            return e;
        });
    }

    public removeTeamMember(memberAddress: string): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            let byteCodeData = teamManager.methods.removeFromTeam(this.currentTeamUid, memberAddress).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        });
    }

    public inviteToCurrentTeam(emails: Array<string>, userType: AppConfig.UserType): Promise<void | TransactionReceipt> {
        return this.inviteMultipleEmailsToTeam(this.currentTeamUid, emails, userType, AppConfig.DEFAULT_INVITATION_EXP_IN_SECS);
    }

    public inviteEmailToTeam(
        teamUid: number, email: string,
        userType: AppConfig.UserType, expInSecs: number): Promise<void | TransactionReceipt> {
        const keyEmail = this.getEncodedKey(email);
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            let byteCodeData = teamManager.methods.inviteToTeam(teamUid, keyEmail, userType as number, expInSecs).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return this.saveValue(email);
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
                    let keyEmail = this.getEncodedKey(email);
                    let byteCodeData = teamManager.methods.inviteToTeam(teamUid, keyEmail, userType as number, expInSecs).encodeABI();
                    return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
                });
            },
            Promise.resolve());
        }).then(res => {
            this.log.d("The petition to invite multiples mails");
            this.log.d("Setting values in the dictionay");
            return emails.reduce(
                (prevVal, email) => {
                    return prevVal.then(() => {
                        return this.saveValue(email);
                    });
                },
                Promise.resolve()
            );
        });
    }

    public sendEmailInvitations(emails: Array<string>): Promise<void> {
        return this.getCurrentVersionCloud().then((version: number) => {
            let promises = emails.map(email => 
                this.http.post(AppConfig.TEAM_API + email + "/" + version + AppConfig.INVITATION_PATH, {}).toPromise()
            );
            return Promise.all(promises);
        }).then(result => this.log.d("The email invitations have been send"))
        .catch(e => this.log.e("Error sending the invitation via email"));
    }

    public removeInvitation(email: string): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            const keyEmail = this.getEncodedKey(email);
            let byteCodeData = teamManager.methods.removeInvitationToTeam(this.currentTeamUid, keyEmail).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        });
    }

    public getUserTeam(): Promise<Array<number>> {
        let promise;
        if (this.teamUids) {
            promise = new Promise(resolve => resolve(this.teamUids));
        } else {
            promise = this.initProm.then(([bright, commit, root, teamManager]) => {
                return teamManager.methods.getUserTeam(this.currentUser.address).call({ from: this.currentUser.address });
            })
            .then((teamUidStr: Array<string>) => {
                return teamUidStr.map(teamUid => parseInt(teamUid));
            });
        }
        return promise;
    }

    public getUserParticipatingTeams(): Promise<Array<MemberVersion>> {
        let availableVersions: Array<number>;
        return this.getUserParticipatingVersions()
        .then((versions: Array<number>) => {
            this.log.d("Available versions: ", versions);
            availableVersions =  versions.filter(version => version !== 0);
            return this.initProm;
        }).then(([bright, commit, root, teamManager, bbFactory, brightDictionary, proxyManager]) => {
            let promises = availableVersions.map(version => 
                proxyManager.methods.getUserTeam(version, this.currentUser.address).call({ from: this.currentUser.address })
            );
            return Promise.all(promises);
        }).then((teamUids: Array<Array<number>>) => {
            let userTeams = availableVersions.map((version, index) => {
                return new MemberVersion(version, teamUids[index]); 
            });
            return userTeams;
        })
        .catch(e => {
            this.log.e("Error gettin user participating teams: ", e);
            throw e;
        });
    }

    public getUserParticipatingVersions(): Promise<Array<number>> {
        return this.initProm.then(([bright, commit, root, teamManager, bbFactory, brightDictionary, proxyManager]) => {
            return proxyManager.methods.getUserTeamVersions(this.currentUser.address).call({ from: this.currentUser.address });
        }).then((versions: Array<string>) => {
            return versions.map(version => parseInt(version));
        }).catch(e => {
            this.log.e("Error getting user participating versions: ", e);
            throw e;
        });
    }

    public getUserInvitedTeams(email: string): Promise<Array<MemberVersion>> {
        let availableVersions: Array<number>;
        const keyEmail = this.getEncodedKey(email);
        return this.getUserInvitationsVersions(keyEmail)
        .then((versions: Array<number>) => {
            availableVersions = versions.filter(version => version !== 0);
            return this.initProm;
        }).then(([bright, commit, root, teamManager, bbFactory, brightDictionary, proxyManager]) => {
            let promises = availableVersions.map(version => 
                proxyManager.methods.getAllTeamInvitationsByEmail(version, keyEmail).call({ from: this.currentUser.address })
            );
            return Promise.all(promises);
        }).then((teamUids: Array<Array<number>>) => {
            let userTeams = availableVersions.map((version, index) => {
                return new MemberVersion(version, teamUids[index]); 
            });
            return userTeams;
        }).catch(e => {
            this.log.e("Error getting user invited teams", e);
            return e;
        });
    }

    public getUserInvitationsVersions(email: string): Promise<Array<number>> {
        return this.initProm.then(([bright, commit, root, teamManager, bbFactory, brightDictionary, proxyManager]) => {
            return proxyManager.methods.getVersionsInvitations(email).call({ from: this.currentUser.address });
        }).then((versions: Array<string>) => {
            return versions.map(version => parseInt(version));
        }).catch(e => {
            this.log.e("Error getting versions where the email is invited", e);
            return e;
        });
    }

    public getUserAvailableTeams(): Promise<Array<MemberVersion>> {
        let proxyContract;
        let availableVersions: Array<number>;
        return this.initProm.then(([bright, commit, root, teamManager, bbFactory, brightDictionary, proxyManager]) => {
            proxyContract = proxyManager;
            return proxyContract.methods.getUserTeamVersions().call({ from: this.currentUser.address });
        }).then((versions: Array<number>) => {
            availableVersions = versions;
            let promises = versions.map(version => proxyContract.methods.getUserTeam(version).call({ from: this.currentUser.address }));
            return Promise.all(promises);
        }).then((teamUids: Array<Array<number>>) => {
            let userTeams = availableVersions.map((version, index) => {
                return new MemberVersion(version, teamUids[index]); 
            });
            return userTeams;
        });
    }

    public registerToTeam(email: string, teamUid: number, version?: number): Promise<number> {
        let promise = version ? this.setTeamVersionManager(version) : this.initProm;
        return promise
        .then(([bright, commit, root, teamManager]) => {
            let keyEmail = this.getEncodedKey(email);
            let byteCodeData =  teamManager.methods.registerToTeam(this.currentUser.address, keyEmail, teamUid).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
        })
        .then(() => {
            this.log.d("User registered to a team");
            return this.getUserTeam();
        })
        .then((teamUids: Array<number>) => {
            this.log.d("User registed teams to a team", teamUids, teamUid ===  teamUids[teamUids.length - 1]);
            return teamUid;
        });
    }

    public createTeam(email: string, teamName: string, seasonLength: number): Promise<number> {
        let teamManagerContract: ITrbSmartContact;
        let teamUid;
        const keyEmail = this.getEncodedKey(email);
        const keyTeamName = this.getEncodedKey(teamName);
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            let byteCodeData =  teamManager.methods.createTeam(keyEmail, keyTeamName).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
        })
        .then(() => {
            this.log.d("Team created");
            return this.saveValue(email);
        })
        .then(() => {
            this.log.d("Email value set");
            return this.saveValue(teamName);
        })
        .then(() => {
            this.log.d("Team name val set");
            return this.getUserTeam();
        })
        .then((teamUids: Array<number>) => {
            this.log.d("The user teams are");
            teamUid = teamUids[teamUids.length - 1];
            return teamManagerContract.methods.getTeamMembers(teamUid).call({ from: this.currentUser.address });
        })
        .then((members: Array<Array<string>>) => {
            return this.deployAllContracts(keyEmail, teamUid, seasonLength);
        })
        .then(() => {
            return teamUid;
        });
    }

    public deployAllContracts(email: string, teamUid: number, seasonLength: number): Promise<void | TransactionReceipt | Array<string>> {
        let teamManagerContract: ITrbSmartContact;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            let byteCodeData = teamManagerContract.methods.deployBright(teamUid).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
        })
        .then(() => {
            this.log.d("Bright contract deployed");
            let byteCodeData = teamManagerContract.methods.deployCommits(teamUid).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
        })
        .then(() => {
            this.log.d("Commits contract deployed");
            let byteCodeData = teamManagerContract.methods.deploySettings(teamUid).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
        })
        .then(() => {
            this.log.d("Settings contract deployed");
            let byteCodeData = teamManagerContract.methods.deployRoot(email, teamUid, seasonLength).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
        })
        .then(() => {
            this.log.d("Roots contract deployed");
            return this.getTeamContractAddresses(teamUid);
        });
    }

    public getTeamContractAddresses(teamUid: number): Promise<void | TransactionReceipt | Array<string>> {
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            return teamManager.methods.getTeamContractAddresses(teamUid).call({ from: this.currentUser.address });
        });
    }

    public getTeamName(teamUid: number): Promise<string> {
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            return teamManager.methods.getTeamName(teamUid).call({ from: this.currentUser.address });
        }).then(keyTeamName => {
            return this.getValueFromContract(keyTeamName);
        }).then(encodeName => {
            return EncryptionUtils.decode(encodeName);
        });
    }

    public getVersionTeamName(teamUid: number, version: number): Promise<string> {
        return this.initProm.then(([bright, commit, root, teamManager, bbFactory, brightDictionary, proxyManager]) => {
            return proxyManager.methods.getTeamName(version, teamUid).call({ from: this.currentUser.address });
        }).then(keyTeamName => {
            return this.getValueFromContract(keyTeamName);
        }).then(encodeName => {
            return EncryptionUtils.decode(encodeName);
        });
    }

    public getCurrentTeamName(): Promise<string> {
        return this.getTeamName(this.currentTeamUid);
    }

    public changeTeamName(teamName: string): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            const keyTeamName = this.getEncodedKey(teamName);
            let byteCodeData = teamManager.methods.setTeamName(this.currentTeamUid, keyTeamName).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return this.saveValue(teamName);
        });
    }

    public createUser(pass: string): Blob {
        const web3: Web3 = Web3Service.getStaticWeb3();
        let createAccount = web3.eth.accounts.create(web3.utils.randomHex(32));
        let encrypted = web3.eth.accounts.encrypt(createAccount.privateKey, pass);
        return new Blob([JSON.stringify(encrypted)], { type: "text/plain" });
    }

    public setProfile(name: string, mail: string): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright]) => {
            this.log.d("Setting profile with name and mail: ", [name, mail]);
            const encodeName = EncryptionUtils.encode(name);
            const keyEmail = this.getEncodedKey(mail);
            let byteCodeData = bright.methods.setProfile(encodeName, keyEmail).encodeABI();
            this.log.d("Bytecode data: ", byteCodeData);
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressBright, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        })
        .catch(e => {
            this.log.e("Error setting profile: ", e);
            throw e;
        });
    }

    public addCommit(url: string, title: string, usersMail: Array<string>): Promise<void | TransactionReceipt> {
        let rootContract: ITrbSmartContact;
        let teamManagerContract: ITrbSmartContact;
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
            let byteCodeData = commit.methods.setNewCommit(
                encodeTitle,
                encodeUrl,
                numUsers
            ).encodeABI();
            this.log.d("DATA: ", byteCodeData);
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressCommits, this.currentUser);
        }).then(() => {
            this.log.d("Added commit, ", title);
            isAlreadyUploaded = true;
            let emailsArray = usersMail.filter(email => !!email).map(email => {
                return this.getEncodedKey(email);
            });
            let byteCodeData = rootContract.methods.notifyCommit(
                encodeUrl,
                emailsArray
            ).encodeABI();
            this.log.d("byteCodeData of notifyCommit: ", byteCodeData);
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressRoot, this.currentUser);
        }).then(() => {
            this.log.d("Notified commit to the reviewers", title);
            let byteCodeData = teamManagerContract.methods.addProject(
                this.currentTeamUid,
                encodedProject
            ).encodeABI();
            this.log.d("byteCodeData of notifyCommit: ", byteCodeData);
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressTeamManager, this.currentUser);
        }).then(res => {
            this.log.d("Added project user projects", project);
            this.log.d("The commit add Transaction is processed");
            return res;
        }).catch(e => {
            if (isAlreadyUploaded) {
                this.deleteCommit(encodeUrl);
            }
            this.log.e("Error in addcommit: ", e);
            throw e;
        });
    }

    public getAllProjects(): Promise<Array<string>> {
        let teamManagerContract: ITrbSmartContact;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            teamManagerContract = teamManager;
            return teamManagerContract.methods.getProjectPageCount(this.currentTeamUid).call({ from: this.currentUser.address });
        })
        .then((blockPositions: number) => {
            let promises = new Array<Promise<Array<string>>>();
            for (let i = 0; i <= blockPositions; i++) {
                promises.push(teamManagerContract.methods.getAllProjects(this.currentTeamUid, i).call({ from: this.currentUser.address }));
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

    public deleteCommit(url: string): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright]) => {
            this.log.d("Request to delete the commit: " + url);
            const encodeUrl = EncryptionUtils.encode(url);
            let urlKeccak = this.web3.utils.keccak256(encodeUrl);
            let byteCodeData = bright.methods.removeUserCommit(urlKeccak).encodeABI();
            this.log.d("Bytecode data: ", byteCodeData);
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressBright, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
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
            endIndex = Math.max(pendingReviews, finishedReviews);
            return this.initProm;
        }).then(([bright]) => {
            let currentSeason = this.storageSrv.get(AppConfig.StorageKey.CURRENTSEASONINDEX);
            return bright.methods.getUserSeasonCommits(this.currentUser.address, currentSeason, 0, endIndex)
                .call({ from: this.currentUser.address })
                .then((allUserCommits: Array<Array<string>>) => {
                    let promisesPending = allUserCommits[0].map(userCommit => this.getUserCommitDetails(userCommit));
                    let promisesFinished = allUserCommits[1].map(userCommit => this.getUserCommitDetails(userCommit, false));
                    return Promise.all([Promise.all(promisesPending), Promise.all(promisesFinished)]);
                });
        }).catch(err => {
            this.log.e("Error obtaining commits to review :", err);
            throw err;
        });
    }

    public getUserPendingReviews(address: string): Promise<number> {
        let brightContract: ITrbSmartContact;
        return this.initProm
        .then(([bright]) => {
            brightContract = bright;
            return this.callAndRetry(() => {
                return bright.methods.getCurrentSeason().call({from: address});
            });
        }).then(seasonData => {
            let currentSeason = seasonData[0];
            return this.callAndRetry(() => {
                return brightContract.methods.getUserSeasonState(address, currentSeason)
                .call({ from: address});
            });
        }).then((seasonState: Array<string>) => {
            this.pendingReviews = parseInt(seasonState[0]);
            return this.pendingReviews;
        }).catch(err => {
            this.log.e("Error obtaining the pending reviews of the user:", err);
            throw err;
        });
    }

    public getCurrentSeasonState(): Promise<UserSeasonState> {
        let brightContract: ITrbSmartContact;
        return this.initProm
        .then(([bright]) => {
            brightContract = bright;
            return this.callAndRetry(() => {
                return bright.methods.getCurrentSeason().call({ from: this.currentUser.address});
            });
        }).then(seasonData => {
            let currentSeason = seasonData[0];
            this.storageSrv.set(AppConfig.StorageKey.CURRENTSEASONINDEX, currentSeason);
            return this.callAndRetry(() => {
                return brightContract.methods.getUserSeasonState(this.currentUser.address, currentSeason)
                .call({ from: this.currentUser.address});
            });
        }).then((seasonState: Array<string>) => {
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

    public getSeasonCommitsToReviewRecursive(endIndex: number, iterationIndex = 0): Promise<Array<Array<UserCommit>>> {
        let brightContract: ITrbSmartContact;
        return this.initProm
        .then(([bright]) => {
            brightContract = bright;
            return brightContract.methods.getCurrentSeason().call({ from: this.currentUser.address });
        }).then(seasonData => {
            let startIndex = endIndex - AppConfig.COMMITS_BLOCK_SIZE;
            startIndex = Math.max(startIndex, 0);
            return this.callAndRetry(() => {
                return brightContract.methods.getUserSeasonCommits(this.currentUser.address, seasonData[0], startIndex, endIndex)
                .call({ from: this.currentUser.address });
            });
        }).then((allUserCommits: Array<Array<string>>) => {
            let promisesAllReviews = allUserCommits[4].map(userCommit => this.getUserCommitDetails(userCommit));
            let promisesPending = allUserCommits[0].map(userCommit => this.getUserCommitDetails(userCommit));
            let promisesFinished = allUserCommits[1].map(userCommit => this.getUserCommitDetails(userCommit, false));
            return Promise.all([Promise.all(promisesPending), Promise.all(promisesFinished), Promise.all(promisesAllReviews)]);
        }).catch(err => {
            let ret: Promise<Array<Array<UserCommit>>>;
            if (AppConfig.ERROR_IDENTIFIERS.some(errorId => errorId === err.message)) {
                ret = this.getSeasonCommitsToReviewRecursive(endIndex, iterationIndex + 1);
            } else {
                this.log.e("Error obtaining commits to review :", err);
                throw err;
            }
            return ret;
        });
    }

    public getAllUserAddresses(): Promise<Array<string>> {
        return this.initProm
        .then(([bright]) => {
            return this.callAndRetry(() => {
                return bright.methods.getUsersAddress().call({ from: this.currentUser.address });
            });
        }).catch(err => {
            this.log.e("Error getting all users adresses :", err);
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
            return this.callAndRetry(() => {
                return commit.methods.getDetailsCommits(this.web3.utils.keccak256(encodeUrl)).call({ from: this.currentUser.address });
            })
            .then((commitVals: Array<string>) => {
                let result = returnsUserCommits ?
                    UserCommit.fromSmartContract(commitVals, false) : CommitDetails.fromSmartContract(commitVals);
                return result;
            });
        }).catch(err => {
            this.log.e("Error getting commit details :", err);
            throw err;
        });
    }

    public setReview(url: string, text: string, points: Array<number>): Promise<void> {
        return this.initProm.then(([bright, commit, root]) => {
            const encodeUrl = EncryptionUtils.encode(url);
            const encodeText = EncryptionUtils.encode(text);
            let byteCodeData = commit.methods.setReview(encodeUrl, encodeText, points).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("Introduced text: ", text);
            this.log.d("Introduced points: ", points);
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressCommits, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        }).catch(e => {
            this.log.e("Error setting a review: ", e);
            throw e;
        });

    }

    public getCommentsOfCommit(url: string): Promise<Array<CommitComment>> {
        return this.initProm.then(([bright, commit]) => {
            const encodeUrl = EncryptionUtils.encode(url);
            let urlKeccak = this.web3.utils.keccak256(encodeUrl);
            return this.callAndRetry(() => {
                return commit.methods.getCommentsOfCommit(urlKeccak).call({ from: this.currentUser.address });
            })
            .then((allComments: Array<Array<string>>) => {
                let promisesFinished = allComments[1].map(comment => commit.methods.getCommentDetail(urlKeccak, comment)
                    .call({ from: this.currentUser.address })
                    .then((commitVals: Array<any>) => {
                        return this.callAndRetry(() => {
                            return Promise.all([commitVals, bright.methods.getUserName(commitVals[4])
                            .call({ from: this.currentUser.address })]);
                        });
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
            return this.callAndRetry(() => {
                return commit.methods.getCommitScores(urlKeccak).call({ from: this.currentUser.address });
            });
        }).catch(err => {
            this.log.e("Error getting comments of commit :", err);
            throw err;
        });
    }

    public getUserDetails(hash: string): Promise<UserDetails> {
        let userVals: Array<string>;
        return this.userCacheSrv.getUser(hash).catch(() => {
            return this.initProm.then(([bright]) => {
                return this.callAndRetry(() => {
                    return bright.methods.getUser(hash).call({ from: this.currentUser.address });
                });
            }).then((user: Array<string>) => {
                userVals = user;
                return this.getValueFromContract(userVals[1]);
            }).then((encodeEmail: string) => {
                userVals[1] = encodeEmail;
                let userValsToUserDetails = UserDetails.fromSmartContract(userVals);
                this.userCacheSrv.set(hash, userValsToUserDetails);
                return userValsToUserDetails;
            }).catch(err => {
                this.log.e("Error getting user details :", err);
                throw err;
            });
        });
    }

    public getCurrentSeasonThreshold(): Promise<Array<number>> {
        return this.initProm.then(([bright, commit, root]) => {
            return this.callAndRetry(() => {
                return root.methods.getCurrentSeasonThreshold().call({ from: this.currentUser.address });
            });
        }).catch(e => {
            this.log.e("Error getting current season threshold: ", e);
            throw e;
        });
    }

    public getSeasonThreshold(seasonIndex: number): Promise<Array<number>> {
        return this.initProm.then(([bright, commit, root]) => {
            return this.callAndRetry(() => {
                return root.methods.getSeasonThreshold(seasonIndex).call({ from: this.currentUser.address });
            });
        }).catch(e => {
            this.log.e("Error getting season threshold: ", e);
            throw e;
        });
    }

    public passToNewSeasonAndSetThresholds(seasonIndex: number, commitThreshold: number, reviewThreshold: number)
    : Promise<void | TransactionReceipt> {
        let brightContract: ITrbSmartContact;
        let teamManagerContract: ITrbSmartContact;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            brightContract = bright;
            teamManagerContract = teamManager;
            let tx = bright.methods.checkSeason().encodeABI();
            return this.transactionQueueSrv.enqueue(tx, this.contractAddressBright, this.currentUser);
        }).then(() => {
            let tx = brightContract.methods.setSeasonThresholds(seasonIndex, commitThreshold, reviewThreshold).encodeABI();
            return this.transactionQueueSrv.enqueue(tx, this.contractAddressBright, this.currentUser);
        })
        .then(() => {
            let tx = teamManagerContract.methods.clearAllProjects(this.currentTeamUid).encodeABI();
            return this.transactionQueueSrv.enqueue(tx, this.contractAddressTeamManager, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        }).catch(e => {
            this.log.e("Error getting season threshold: ", e);
            throw e;
        });
    }

    public setCurrentSeasonThreshold(commitThreshold: number, reviewThreshold: number): Promise<void> {
        return this.initProm.then(([bright, commit, root]) => {
            let byteCodeData = root.methods.setCurrentSeasonThresholdOwner(commitThreshold, reviewThreshold).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressRoot, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        }).catch(e => {
            this.log.e("Error setting new thresold: ", e);
            throw e;
        });
    }


    public setThumbReviewForComment(url: string, index: number, value: number): Promise<void | TransactionReceipt> {
        let rootContract: ITrbSmartContact;
        return this.initProm.then(([bright, commit, root]) => {
            rootContract = root;
            return this.getCommentsOfCommit(url);
        }).then((arrayOfComments: Array<CommitComment>) => {
            const encodeUrl = EncryptionUtils.encode(url);
            let byteCodeData = rootContract.methods.setVote(encodeUrl, arrayOfComments[index].user, value).encodeABI();
            this.log.d("Introduced value: ", value);
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressRoot, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        }).catch(e => {
            this.log.e("Error setting thumbs: ", e);
            throw e;
        });
    }

    public setSeasonLength(seasonLength: number): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright, commit, root]) => {
            let byteCodeData = root.methods.setSeasonLength(seasonLength).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressRoot, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        }).catch(e => {
            this.log.e("Error setting the new season length: ", e);
            throw e;
        });
    }

    public reviewChangesCommitFlag(url: string): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright, commit, root]) => {
            const encodeUrl = EncryptionUtils.encode(url);
            let byteCodeData = root.methods.readCommit(encodeUrl).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("DATA: ", byteCodeData);
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressRoot, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        }).catch(e => {
            this.log.e("Error changing commit flag: ", e);
            throw e;
        });
    }

    public readPendingCommit(url: string): Promise<void> {
        return this.initProm.then(([bright]) => {
            const encodeUrl = EncryptionUtils.encode(url);
            let byteCodeData = bright.methods.readPendingCommit(encodeUrl).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("DATA: ", byteCodeData);
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressBright, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        }).catch(e => {
            this.log.e("Error reading pending commit: ", e);
            throw e;
        });
    }

    public getAllUserReputation(season: number, global: boolean): Promise<Array<UserReputation>> {
        let contractArtifact: ITrbSmartContact;
        let usersVals;
        return this.initProm.then(([bright]) => {
            contractArtifact = bright;
            return contractArtifact.methods.getUsersAddress().call({ from: this.currentUser.address });
        }).then((usersAddress: Array<string>) => {
            let numberUsers = usersAddress.length;
            this.log.d("Number of users: ", numberUsers);
            let promises = usersAddress.map(userAddress => {
                return global ? this.getUserData(userAddress) : this.getUserSeasonData(userAddress, season);
            });
            return Promise.all(promises);
        }).then(users => {
            usersVals = users;
            let promises = users.map(user => this.getValueFromContract(user[1]));
            return Promise.all(promises);
        }).then((encodeEmails: Array<string>) => {
            let usersReputation = usersVals.map((userVals, index) => {
                userVals[1] = encodeEmails[index];
                return global ? UserReputation.fromSmartContractGlobalReputation(userVals) : UserReputation.fromSmartContract(userVals);
            });
            return usersReputation;
        });
    }

    public getCurrentSeason(): Promise<Array<number>> {
        return this.initProm.then(([bright]) => {
            return this.callAndRetry(() => {
                return bright.methods.getCurrentSeason().call({ from: this.currentUser.address });
            });
        }).then((seasonState: Array<number>) => {
            this.storageSrv.set(AppConfig.StorageKey.CURRENTSEASONINDEX, seasonState[0]);
            let arrayState =  Object.keys(seasonState)
            .map(key => parseInt(seasonState[key]));
            return arrayState;
        }).catch(err => {
            this.log.e("Error getting current season :", err);
            throw err;
        });
    }

    public getTextRules(): Promise<string> {
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            return this.callAndRetry(() => {
                return root.methods.getTextRules().call({ from: this.currentUser.address });
            });
        }).then(textRules => {
            let allText = textRules.map(byteRules => {
                const bytesText = this.web3.utils.toUtf8(byteRules);
                const decodeText = EncryptionUtils.decode(bytesText);
                return decodeText;
            });
            return allText.join("");
        }).catch(err => {
            this.log.e("Error getting rules :", err);
            throw err;
        });
    }

    public changeTextRules(textRules: string): Promise<void | TransactionReceipt> {
        let textRulesChopped = textRules.match(this.MAX_LENGTH_BYTES32);
        let final = textRulesChopped.map(rules => {
            let encodeText = EncryptionUtils.encode(rules);
            let bytesText = this.web3.utils.fromUtf8(encodeText);
            return bytesText;
        });
        return this.initProm.then(([bright, commit, root]) => {
            let byteCodeData = root.methods.setTextRules(final).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressRoot, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        }).catch(err => {
            this.log.e("Error setting rules :", err);
            throw err;
        });
    }

    public setRandomReviewer(random: boolean): Promise<void> {
        return this.initProm.then(([bright, commit, root]) => {
            let byteCodeData = root.methods.setRandomReviewer(random).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressRoot, this.currentUser);
            }).then(res => {
            this.log.d("Transaction processed");
        }).catch(e => {
            this.log.e("Error setting random reviewer: ", e);
            throw e;
        });
    }

    public getRandomReviewer(): Promise<boolean> {
        return this.initProm.then(([bright, commit, root]) => {
            return this.callAndRetry(() => {
                return root.methods.getRandomReviewer().call({ from: this.currentUser.address });
            });
        }).then(res => {
            return Boolean(res);
        }).catch(e => {
            this.log.e("Error getting random reviewer: ", e);
            throw e;
        });
    }

    public isCommitPendingToRead(url: string): Promise<boolean> {
        const encodeUrl = EncryptionUtils.encode(url);
        let urlKeccak = this.web3.utils.keccak256(encodeUrl);
        return this.initProm.then(contract => {
            let promise = contract[0].methods.isCommitPendingToRead(urlKeccak).call({ from: this.currentUser.address});
            return promise;
        }).catch(err => {
            this.log.e("Error getting urls (Feedback) :", err);
            throw err;
        });
    }

    public getReviewers(url: string): Promise<Array<Array<string>>> {
        return this.initProm.then(([bright, commit]) => {
            const encodeUrl = EncryptionUtils.encode(url);
            let urlKeccak = this.web3.utils.keccak256(encodeUrl);
            return this.callAndRetry(() => {
                return commit.methods.getCommentsOfCommit(urlKeccak).call({ from: this.currentUser.address });
            });
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
            let usrPromiseList = [userPending, userFinished];
            return Promise.all(usrPromiseList.map(UsrPro => {
                return Promise.all(UsrPro);
            })
            );
        });
    }

    public setUserName(name: string): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright]) => {
            const encodeName = EncryptionUtils.encode(name);
            let byteCodeData = bright.methods.setUserName(encodeName).encodeABI();
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressBright, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            this.userCacheSrv.setUserName(this.currentUser.address, name);
            return res;
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

    public getCurrentVersion(): Promise<number> {
        return this.initProm.then(([bright, commit, root, teamManager, bbFactory, brightDictionary, proxyManager]) => {
            return proxyManager.methods.getCurrentVersion().call({ from: this.currentUser.address });
        }).then((version: string) => parseInt(version));
    }

    public getCurrentVersionCloud(): Promise<number> {
        return this.initProm.then(([bright, commit, root, teamManager, bbFactory]) => {
            return bbFactory.methods.getCurrentVersion().call({ from: this.currentUser.address });
        }).then((version: string) => parseInt(version))
        .catch(error => {
            this.log.e("Error getting current current version", error);
            throw error;
        });
    }

    public getCurrentVersionFromBase(): Promise<number> {
        return this.initProm.then(([bright, commit, root]) => {
            return root.methods.getVersion().call({ from: this.currentUser.address });
        }).then((version: string) => parseInt(version));
    }

    private getUserData(userAddress: string): Promise<Array<string>> {
        return this.initProm.then(([bright]) => {
            return this.callAndRetry(() => {
                return bright.methods.getUser(userAddress).call({ from: this.currentUser.address });
            });
        }).then((res: Array<string>) => {
            this.log.d("The user data is: ", res);
            return res;
        });
    }

    private getUserSeasonData(userAddress: string, season: number): Promise<Array<string>> {
        this.log.d("The user data is: ", userAddress);
        return this.initProm.then(([bright]) => {
            return this.callAndRetry(() => {
                return bright.methods.getUserSeasonReputation(userAddress, season).call({ from: this.currentUser.address });
            });
        }).then((res: Array<string>) => {
            this.log.d("The user data is: ", res);
            return res;
        });
    }

    private getBatchCommits(totalNumberOfCommits: number, startIndex: number, allCommits: Array<string>): Promise<Array<string>> {
        let endIndex = startIndex + AppConfig.COMMITS_BLOCK_SIZE;
        return this.initProm.then(([bright]) => {
            let currentSeason = this.storageSrv.get(AppConfig.StorageKey.CURRENTSEASONINDEX);
            return bright.methods.getUserSeasonCommits(this.currentUser.address, currentSeason, startIndex, endIndex)
                .call({ from: this.currentUser.address });
        }).then((allUserCommits: Array<Array<string>>) => {
            let userCommits = allUserCommits[2].filter(commit => commit !== AppConfig.EMPTY_COMMIT_HASH);
            allCommits = allCommits.concat(userCommits);
            let batchLength = allCommits.length;
            return (totalNumberOfCommits > batchLength) ? this.getBatchCommits(totalNumberOfCommits, endIndex, allCommits) : allCommits;
        }).catch(err => {
            this.log.e("Error obtaining user commits :", err);
            throw err;
        });
    }

    private getUserCommitDetails(url: string, isPending = true): Promise<UserCommit> {
        return this.initProm.then(([bright, commit]) => {
            return this.callAndRetry(() => {
                return commit.methods.getDetailsCommits(url).call({ from: this.currentUser.address });
            });
        }).then((commitVals: Array<string>) => {
            return UserCommit.fromSmartContract(commitVals, isPending);
        }).catch(err => {
            this.log.e("Error getting commit details :", err);
            throw err;
        });
    }

    private getEncodedKey(key: string): string {
        const encodeKey = EncryptionUtils.encode(key);
        const bytesKey = this.web3.utils.keccak256(encodeKey);
        return bytesKey;
    }


    private getValueFromContract(key: string): Promise<string> {
        return this.initProm.then(([bright, commit, root, teamManager, bbFactory, brightDictionary]) => {
            return brightDictionary.methods.getValue(key).call({ from: this.currentUser.address});
        }).catch(err => {
            this.log.e("Error getting value from Bright Dictionary :", err);
            throw err;
        });
    }

    private saveValue(key: string): Promise<void | TransactionReceipt> {
        return this.initProm.then(([bright, commit, root, teamManager, bbFactory, brightDictionary]) => {
            const value = EncryptionUtils.encode(key);
            const encodeKey = this.getEncodedKey(key);
            let byteCodeData = brightDictionary.methods.setValue(encodeKey, value).encodeABI();
            this.log.d("Setting key with value: ", encodeKey, value);
            this.log.d("DATA: ", byteCodeData);
            return this.transactionQueueSrv.enqueue(byteCodeData, this.contractAddressBrightDictionary, this.currentUser);
        }).then(res => {
            this.log.d("Transaction processed");
            return res;
        }).catch(err => {
            this.log.e("Error setting value in Bright Dictionary :", err);
            throw err;
        });
    }

    private setCurrentTeam(teamUid: number) {
        this.currentTeamUid = teamUid;
    }

    private callAndRetry(promiseFn: () => Promise<any>, iterationIndex = 0): Promise<any> {
        return this.getMaxIterationsAndTimeout(iterationIndex, "Error getting data from the smart contracts, maximum number of retries reached: " + this.RECURSIVE_METHODS_MAX_ITERATIONS)
        .then(() => promiseFn())
        .then((res: any) => res)
        .catch(error => {
            let ret: Promise<any>;
            this.log.d("The current number of retries is: ", iterationIndex);
            if (AppConfig.ERROR_IDENTIFIERS.some(errorId => errorId === error.message)){
                this.log.d("The current error is: ", error.message);
                ret = this.callAndRetry(promiseFn, iterationIndex + 1);
            } else {
                this.log.e("Error getting recursive view method:", error);
                throw error;
            }
            return ret;
        });
    }

    private getMaxIterationsAndTimeout(iterationIndex: number, errorMsg: string): Promise<void> {
        let promise: Promise<void>;
        let maxIterations = this.RECURSIVE_METHODS_MAX_ITERATIONS;
        if (iterationIndex >= maxIterations) {
            let error = new Error(errorMsg);
            this.log.e(error);
            throw error;
        } else {
            promise = iterationIndex > 0 ? this.getRandomDelay(this.MINIMUM_DELAY_MILIS, this.MAXIMUM_DELAY_MILIS) : Promise.resolve();
        }
        return promise;
    }

    private getRandomDelay(minDelay: number, maxDelay: number): Promise<void> {
        let delay = Math.floor(Math.random() * maxDelay) + minDelay;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    private getInvitedUserInfo(invitedEmail: string, teamUid: number): Promise<InvitedUser> {
        let invitedUserInfo: Array<string>;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            return teamManager.methods.getInvitedUserInfo(invitedEmail, teamUid).call({ from: this.currentUser.address});
        }).then((invitedUser: Array<string>) => {
            invitedUserInfo = invitedUser;
            return this.getValueFromContract(invitedEmail);
        }).then((emailValue: string) => {
            const decodeEmail = EncryptionUtils.decode(emailValue);
            return new InvitedUser(decodeEmail, parseInt(invitedUserInfo[1]), parseInt(invitedUserInfo[2]));
        }).catch(e => {
            this.log.e("Error getting invited user info from team manager contract: ", e);
            throw e;
        });
    }

    private getTeamMemberInfo(teamUid: number, memberAddress: string): Promise<TeamMember> {
        let userInfo: Array<string>;
        return this.initProm.then(([bright, commit, root, teamManager]) => {
            return teamManager.methods.getUserInfo(teamUid, memberAddress).call({ from: this.currentUser.address});
        }).then((user: Array<string>) => {
            userInfo = user;
            return this.getValueFromContract(user[1]);
        }).then((emailValue: string) => {
            const decodeEmail = EncryptionUtils.decode(emailValue);
            return new TeamMember(memberAddress, decodeEmail, parseInt(userInfo[0]));
        }).catch(e => {
            this.log.e("Error getting user info from team manager contract: ", e);
            throw e;
        });
    }

    private setTeamVersionManager(version: number): Promise<Array<ITrbSmartContact>> {
        let contractArray;
        this.log.d("Setting team version manager: ", version);
        return this.initProm.then((contracts: Array<ITrbSmartContact>) => {
            contractArray = contracts;
            let proxyManager = contracts[6];
            return proxyManager.methods.getVersionContracts(version).call({ from: this.currentUser.address });
        })
        .then((contractAddress: string) => {
            this.log.d("Version team manager address is : ", contractAddress);
            let teamManagerContract = new this.web3.eth.Contract(this.contractJsonTeamManager.abi, contractAddress);
            this.contractAddressTeamManager = contractAddress;
            contractArray[3] = teamManagerContract;
            this.initProm = Promise.all(contractArray);
            return this.initProm;
        });
    }
}
