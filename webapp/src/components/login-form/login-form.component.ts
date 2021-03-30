import { Component, Output, EventEmitter } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { LoginService } from "../../core/login.service";
import { TabsPage } from "../../pages/tabs/tabs";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { SpinnerService } from "../../core/spinner.service";
import { UserLoggerService } from "../../domain/user-logger.service";
import { AppConfig } from "../../app.config";
import { BackendApiService } from "../../domain/backend-api.service";
import { AvatarService } from "../../domain/avatar.service";
import { Team } from "../../models/team.model";
import { MemberVersion } from "../../models/member-version.model";
import { PopupService } from "../../domain/popup.service";
import { Account } from "web3-eth-accounts";

@Component({
    selector: "login-form",
    templateUrl: "login-form.component.html",
    styles: ["login-form.component.scss"]
})

export class LoginForm {

    @Output()
    public goToRegister = new EventEmitter();

    @Output()
    public goToSetProfile = new EventEmitter();

    @Output()
    public setUserName = new EventEmitter();

    @Output()
    public setUserEmail = new EventEmitter();

    public msg: string;
    public text: any;
    public debuggingText: string;
    public isDebugMode = false;
    public appVersion = "DEV";
    public migrationDone = false;
    public isKeepCredentialsOn = false;
    public hidPass = "";
    public showTeamSelector = false;
    public showNameInput = false;
    public showMoreTeams = false;
    public showMoreInvites = false;
    public displayTeamList: Array<Team>;
    public displayInvitationList: Array<Team>;
    public teamList: Array<Team>;
    public invitationList: Array<Team>;
    public userName: string;
    public teamToRegisterIn: number;
    public versionToRegisterIn: number;
    public isRegistering: boolean;
    
    private readonly NEW_USER = "new-user";
    private readonly SET_PROFILE = "set-profile";
    private readonly HID_CHARACTER = "*";
    private readonly BASE_URL = window.location.origin + "/";
    private readonly LOG_QUERY = "&" + AppConfig.UrlKey.LOGID + "=true";
    private readonly REGISTER_QUERY = "&" + AppConfig.UrlKey.REGISTERID + "=true";
    private readonly VERSION_QUERY = "?" + AppConfig.UrlKey.VERSIONID + "=";
    private readonly TEAM_QUERY = "&" + AppConfig.UrlKey.TEAMID + "=";
    private readonly USER_NAME_QUERY = "&" + AppConfig.UrlKey.USERNAMEID + "=";
    private readonly MAX_TEAMS_DISPLAY = 4;

    private log: ILogger;
    private password = "";
    private lastPassword = "";
    private userEmail: string;
    private autoLogin: boolean;
    private autoLoginVersion: boolean;
    private isAutoRegister: boolean;
    private versionToLog: number;
    private currentCloudVersion: number;
    private teamUid: number;




    constructor(
        private navCtrl: NavController,
        private contractManager: ContractManagerService,
        private loginService: LoginService,
        private userLoggerService: UserLoggerService,
        private spinnerService: SpinnerService,
        private backendApiSrv: BackendApiService,
        private avatarSrv: AvatarService,
        private popupSrv: PopupService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("LoginForm");

        this.migrationDone = this.userLoggerService.getMigration();
    }

    public ngOnInit() {
        let password: string;
        let url = new URLSearchParams(document.location.search);
        this.log.d("The url is ", url);
        if (url.has(AppConfig.UrlKey.REGISTERID) || url.has(AppConfig.UrlKey.LOGID)) {
            let retrievedUser = this.userLoggerService.retrieveLogAccount();
            this.text = retrievedUser.user;
            password = retrievedUser.password;
            if (password) {
                this.log.d("User retrieved from localStorage: " + this.text);
                if (url.has(AppConfig.UrlKey.VERSIONID)) {
                    this.versionToLog = parseInt(url.get(AppConfig.UrlKey.VERSIONID));
                    window.history.pushState("", "", "/" + this.versionToLog + "/");
                    this.teamUid = parseInt(url.get(AppConfig.UrlKey.TEAMID));
                    this.userName = (url.has(AppConfig.UrlKey.USERNAMEID)) ? url.get(AppConfig.UrlKey.USERNAMEID) : "";
                    this.autoLoginVersion = true;
                    this.isAutoRegister = url.has(AppConfig.UrlKey.REGISTERID);
                    this.login(password);
                }
            }
        } else {
            let retrievedUser = this.userLoggerService.retrieveAccount();
            this.text = retrievedUser.user;
            password = retrievedUser.password;
            if (password) {
                this.log.d("User retrieved from localStorage: " + this.text);
                if (url.has(AppConfig.UrlKey.REVIEWID) || url.has(AppConfig.UrlKey.COMMITID) && url.has(AppConfig.UrlKey.TEAMID)) {
                    this.autoLogin = true;
                    this.teamUid = parseInt(url.get(AppConfig.UrlKey.TEAMID));
                    this.versionToLog = parseInt(url.get(AppConfig.UrlKey.VERSIONID));
                }
                this.login(password);
            }
        }
    }

    public toggleKeepCredentials() {
        this.isKeepCredentialsOn = !this.isKeepCredentialsOn;
    }

    public openFile(event: Event) {
        this.log.d("Event: ", event);
        let target = <HTMLInputElement>event.target;
        let uploadedArray = <FileList>target.files;
        let msgIdentifier = "";
        this.log.d("Target: ", target);
        let input = uploadedArray[0];
        if (!input) {
            msgIdentifier = "app.fileNotSelected";
        } else if (input.type === "application/json") {
            this.msg = "";
            this.log.d("Input: ", input);
            let reader = new FileReader();
            reader.readAsText(input);
            reader.onload = () => {
                this.debuggingText = String(reader.result);
                this.text = JSON.parse(String(reader.result));
            };
        } else {
            msgIdentifier = "app.wrongFile";
        }
        if (msgIdentifier) {
            this.msg = msgIdentifier;
        }
    }

    public hidePassword(pass: string) {
        let passLength = pass.length;
        let lastPassLength = this.lastPassword.length;
        if (pass !== "" && lastPassLength <= passLength) {
            this.password = this.password + pass.substring(lastPassLength, passLength);
        } else if (pass !== "" && lastPassLength > passLength) {
            this.password = this.password.substring(0, this.password.length - (lastPassLength - passLength));
        } else {
            this.password = "";
        }
        this.hidPass = this.password.replace(/./g, this.HID_CHARACTER);
        this.lastPassword = pass;
    }

    public login(pass: string) {
        this.spinnerService.showLoader();
        try {
            this.log.d("File imported: ", this.text);
            if (this.text === undefined) {
                this.log.e("File not loaded");
                this.msg = "app.fileNotLoaded";
                this.spinnerService.hideLoader();
            } else {
                if (this.isKeepCredentialsOn) {
                    this.userLoggerService.setAccount(this.text, pass);
                }
                let account = this.contractManager.getUserAccount(this.text, pass);
                this.password = pass;
                this.checkNodesAndOpenHomePage(account, 0)
                .then((result) => {
                    this.spinnerService.hideLoader();
                    return true;
                }).catch((e) => {
                    this.spinnerService.hideLoader();     
                    this.msg = "app.connectionFailure";
                    this.log.e("There is no node available for connection", e);
                });
            }
        } catch (e) { 
            this.msg = "app.wrongPassword";
            this.log.e("Wrong password", e);
            this.spinnerService.hideLoader();
        }
    }

    public register() {
        this.goToRegister.next(this.NEW_USER);
    }

    public logToTeam(teamUid: number, version: number): Promise<void> {
        if (this.currentCloudVersion === version) {
            this.userLoggerService.removeLogAccount();
            return this.contractManager.setBaseContracts(teamUid, version)
                .then(() => {
                    this.loginService.setCurrentVersion(version);
                    this.loginService.setTeamUid(teamUid);
                    this.backendApiSrv.initBackendConnection(teamUid, version);
                    return this.initAvatarSrvAndContinue();
                });
        } else {
            let urlToOpen = this.BASE_URL + version + "/" + 
            this.VERSION_QUERY + version + this.TEAM_QUERY + teamUid + this.LOG_QUERY;
            this.popupSrv.openNewUrl(urlToOpen);
            return Promise.resolve();
        }

    }

    public registerToTeam(): Promise<void> {
        this.isRegistering = true;
        this.log.d("The user request to register to team:", this.teamToRegisterIn, " in the version: ", this.versionToRegisterIn);
        if (this.currentCloudVersion === this.versionToRegisterIn) {
            this.userLoggerService.removeLogAccount();
            return this.contractManager.registerToTeam(this.userEmail, this.teamToRegisterIn, this.versionToRegisterIn)
            .then(() => {
                return this.contractManager.setBaseContracts(this.teamToRegisterIn, this.versionToRegisterIn);
            })
            .then(() => {
                return this.contractManager.setProfile(this.userName, this.userEmail);
            })
            .then(() => {
                return this.contractManager.getCurrentVersionFromBase();
            })
            .then((version: number) => {
                this.loginService.setCurrentVersion(version);
                this.backendApiSrv.initBackendConnection(this.teamToRegisterIn, version);
                return this.initAvatarSrvAndContinue();
            });
        } else {
            let urlToOpen = this.BASE_URL + this.versionToRegisterIn + "/" + this.VERSION_QUERY + this.versionToRegisterIn + 
            this.TEAM_QUERY + this.teamToRegisterIn + this.REGISTER_QUERY + this.USER_NAME_QUERY + this.userName;
            this.popupSrv.openNewUrl(urlToOpen);
            return Promise.resolve();
        }
    }

    public showNameBox(teamUid: number, version: number) {
        this.teamToRegisterIn = teamUid;
        this.versionToRegisterIn = version;
        this.showNameInput = true;
    }

    public openCreateTeam() {
        this.showTeamSelector = false;
        this.setUserName.next(this.userName);
        this.goToSetProfile.next(this.SET_PROFILE);
    }

    public showAllInvites(){
        this.displayInvitationList = this.invitationList;
        this.showMoreInvites = false;
    }

    public showAllTeams(){
        this.displayTeamList = this.teamList;
        this.showMoreTeams = false;
    }

    private initAvatarSrvAndContinue(): Promise<void> {
        return this.contractManager.getAllUserAddresses()
        .then((addresses: Array<string>) => {
            if (addresses.length > 0) {
                addresses.forEach(address => {
                    this.avatarSrv.addUser(address);
                });
                this.navCtrl.push(TabsPage);
            }
        });
    }

    private setUserTeams(userTeams: Array<MemberVersion>, address: string) {
        let userVersion = userTeams[0];
        this.contractManager.getVersionUserEmail(userVersion.teamUids[0], address, userVersion.version)
        .then((email: string) => {
            this.userEmail = email;
            this.setUserEmail.next(email);
            return this.contractManager.getUserInvitedTeams(email);
        })
        .then((invitedTeams: Array<MemberVersion>) => {
            this.log.d("The user is invited to the following teams", invitedTeams);
            return this.getTeams(invitedTeams);
        })
        .then((invitedTeams: Array<Team>) => {
            this.invitationList = this.sortTeams(invitedTeams);
            this.displayInvitationList = this.invitationList;
            this.showMoreInvites = this.invitationList.length > this.MAX_TEAMS_DISPLAY;
            this.log.d("The user is invited to the next teams", invitedTeams);
            this.showTeamSelector = (this.invitationList.length > 0 || userTeams.length > 0);
            if (this.showMoreInvites) {
                this.displayInvitationList = this.invitationList.slice(0, this.MAX_TEAMS_DISPLAY);
            }
            return this.getTeams(userTeams);
        })
        .then((participantTeams: Array<Team>) => {
            this.log.d("The user is participating in the next teams", participantTeams);
            this.teamList = this.sortTeams(participantTeams);
            this.displayTeamList = this.teamList;
            this.showMoreTeams = this.teamList.length > this.MAX_TEAMS_DISPLAY;
            if (this.showMoreTeams) {
                this.displayTeamList = this.teamList.slice(0, this.MAX_TEAMS_DISPLAY);
            }
        })
        .then(() => {
            if(this.autoLoginVersion) {
                this.log.d("The user is participating in the team: ", this.teamUid);
                this.log.d("Participating in the team from version: ", this.versionToLog);
                if (this.isAutoRegister) {
                    this.teamToRegisterIn = this.teamUid;
                    this.versionToRegisterIn = this.versionToLog;
                    this.registerToTeam(); 
                } else {
                    this.logToTeam(this.teamUid, this.versionToLog);
                }
            }
        })
        .catch(e => {
            this.log.e("Error setting user teams", e);
        });
    }
    
    private sortTeams(teams: Array<Team>): Array<Team> {
        teams.sort((team1, team2) => (team2.version - team1.version) !== 0 ? (team2.version - team1.version) : (team2.uid - team1.uid));
        return teams;
    }

    private getTeams(userTeams: Array<MemberVersion>): Promise<Array<Team>> {
        let promises = userTeams.map(version => {
            let ret = version.teamUids.map(uid => this.contractManager.getVersionTeamName(uid, version.version));
            return ret;
        });
        return Promise.all(promises.map(innerPromises => Promise.all(innerPromises)))
        .then((teamNames: Array<Array<string>>) => {
            let teams = new Array<Team>();
            if (teamNames) {
                userTeams.forEach((version, i) => {
                    version.teamUids.forEach((uid, j) => teams.push(new Team(uid, teamNames[i][j], version.version)));
                });
            }
            return this.sortTeams(teams);
        }).catch(e => {
            this.log.e("Error getting teams info", e);
            return e;
        });
    }

    private checkNodesAndOpenHomePage(account: Account, currentNodeIndex: number): Promise<boolean> {
        let prom = Promise.resolve(false);
        let isAlreadyRegisteredToTeam;
        if (currentNodeIndex >= 0 && currentNodeIndex < AppConfig.NETWORK_CONFIG.length) {
            prom = this.contractManager.init(account, currentNodeIndex)
            .then(() => {
                this.userLoggerService.setLogAccount(this.text, this.password);
                this.log.d("Imported account from the login file: ", account);
                this.loginService.setAccount(account);
                this.log.d("Account set. Checking the node number: " + currentNodeIndex);
                return this.contractManager.getCurrentVersionCloud();
            }).then((cloudVersion: number) => {
                this.currentCloudVersion = cloudVersion;
                this.log.d("The current Cloud version is", this.currentCloudVersion);
                return this.contractManager.getUserParticipatingTeams();
            })
            .then((versions: Array<MemberVersion>) => {
                let promise;
                this.log.d("The user is registered in the following teams: " + versions);
                isAlreadyRegisteredToTeam = versions.length !== 0;
                if (isAlreadyRegisteredToTeam) {
                    promise = this.autoLogin ? 
                    this.logToTeam(this.teamUid, this.versionToLog) : this.setUserTeams(versions, account.address);
                    
                } else {
                    this.goToSetProfile.next(this.SET_PROFILE);
                }
                return true;
            })
            .catch((e) => {
                this.log.d("Failure to access the node " + currentNodeIndex);
                return (this.checkNodesAndOpenHomePage(account, currentNodeIndex + 1));
            });
        }
        return prom;
    }
}
