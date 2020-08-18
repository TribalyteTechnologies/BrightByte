import { Component, Output, EventEmitter } from "@angular/core";
import { NavController } from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";
import { ILogger, LoggerService } from "../../core/logger.service";
import { Web3Service } from "../../core/web3.service";
import { LoginService } from "../../core/login.service";
import { AppVersionService } from "../../core/app-version.service";
import { TabsPage } from "../../pages/tabs/tabs";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { SpinnerService } from "../../core/spinner.service";
import { UserLoggerService } from "../../domain/user-logger.service";
import { Account } from "web3-eth-accounts";
import { AppConfig } from "../../app.config";
import { BackendApiService } from "../../domain/backend-api.service";
import { AvatarService } from "../../domain/avatar.service";
import { Team } from "../../models/team.model";

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
    public teamList: Array<Team>;
    public invitationList: Array<Team>;
    public userName: string;
    public teamToRegisterIn: number;
    public isButtonPressed: boolean;

    private readonly NEW_USER = "new-user";
    private readonly SET_PROFILE = "set-profile";
    private readonly HID_CHARACTER = "*";

    private log: ILogger;
    private password = "";
    private lastPassword = "";
    private userEmail: string;
    

    constructor(
        private navCtrl: NavController,
        private translateService: TranslateService,
        private contractManager: ContractManagerService,
        private web3Service: Web3Service,
        private loginService: LoginService,
        private userLoggerService: UserLoggerService,
        private spinnerService: SpinnerService,
        private backendApiSrv: BackendApiService,
        private avatarSrv: AvatarService,
        loggerSrv: LoggerService,
        appVersionSrv: AppVersionService
    ) {
        this.log = loggerSrv.get("LoginForm");
        
        this.migrationDone = this.userLoggerService.getMigration();
    }

    public ngOnInit(){
        let retrievedUser = this.userLoggerService.retrieveAccount();
        this.text = retrievedUser.user;
        let password = retrievedUser.password;
        if (password){
            this.log.d("User retrieved from localStorage: " + this.text);
            this.login(password);
        }
    }

    public toggleKeepCredentials (){
        this.isKeepCredentialsOn = !this.isKeepCredentialsOn;
    }

    public openFile (event: Event) {
        this.log.d("Event: ", event);
        let target = <HTMLInputElement>event.target;
        let uploadedArray = <FileList>target.files;
        let msg_identifier = "";
        this.log.d("Target: ", target);
        let input = uploadedArray[0];
        if (!input) {
            msg_identifier = "app.fileNotSelected";
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
            msg_identifier = "app.wrongFile";
        }
        if (msg_identifier){
            this.translateService.get(msg_identifier)
            .subscribe(msg => this.msg = msg );
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
                this.translateService.get("app.fileNotLoaded").subscribe(
                    msg => {
                        this.msg = msg;
                        this.spinnerService.hideLoader();
                    });
            } else {
                let account = this.web3Service.getWeb3().eth.accounts.decrypt(this.text, pass);
                if (this.isKeepCredentialsOn){
                    this.userLoggerService.setAccount(this.text, pass);
                }
                         
                this.log.d("Imported account from the login file: ", account);
                this.loginService.setAccount(account);
                this.checkNodesAndOpenHomePage(account, 0).then((result) => {
                    this.spinnerService.hideLoader();
                    return true;
                }).catch((e) => {
                    this.spinnerService.hideLoader();
                    
                    this.translateService.get("app.connectionFailure").subscribe(
                        msg => {
                            this.msg = msg;
                            this.log.e(msg, e);
                        });
                });
            }
        } catch (e) {
            this.translateService.get("app.wrongPassword").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                    this.spinnerService.hideLoader();
                });
        }
    }

    public register() {
        this.goToRegister.next(this.NEW_USER);
    }

    public logToTeam(teamUid: number): Promise<void> {
        return this.contractManager.setBaseContracts(teamUid)
        .then(() => {
            this.backendApiSrv.initBackendConnection(teamUid);
            return this.initAvatarSrvAndContinue();          
        });
    }

    public registerToTeam() {
        this.isButtonPressed = true;
        this.contractManager.registerToTeam(this.userEmail, this.teamToRegisterIn)
        .then(() => {
            return this.contractManager.setBaseContracts(this.teamToRegisterIn);
        })
        .then(() => {
            return this.contractManager.setProfile(this.userName, this.userEmail);
        })
        .then(() => {
            this.backendApiSrv.initBackendConnection(this.teamToRegisterIn);
            return this.initAvatarSrvAndContinue(); 
        });
    }

    public showNameBox(teamUid: number) {
        this.teamToRegisterIn = teamUid;
        this.showNameInput = true;
    }

    public openCreateTeam() {
        this.showTeamSelector = false;
        this.setUserName.next(this.userName);
        this.goToSetProfile.next(this.SET_PROFILE);
    }

    private initAvatarSrvAndContinue(): Promise<void> {
        return this.contractManager.getAllUserAddresses()        
        .then((addresses: Array<string>) => {
            if (addresses.length > 0){
                addresses.forEach(address => {
                    this.avatarSrv.addUser(address);
                });
                this.navCtrl.push(TabsPage);
            }
        });
    }

    private getUserTeamAndInvitations(teamUid: number, address: string, alreadyRegisteredTeams: Array<number>) {
        let allTeamUids;
        let showSelector = false;
        this.contractManager.getUserEmail(teamUid, address)
        .then((email: string) => {
            this.userEmail = email;
            this.setUserEmail.next(email);
            return this.contractManager.getAllTeamInvitationsByEmail(email);
        })
        .then((teamUids: Array<number>) => {
            showSelector = (teamUids.length > 0 || alreadyRegisteredTeams.length > 0);
            allTeamUids = teamUids;
            return this.getAndSetTeamNames(allTeamUids, true);
        })
        .then(() => {
            this.showTeamSelector = showSelector;
            return this.getAndSetTeamNames(alreadyRegisteredTeams, false);
        });
    }

    private getAndSetTeamNames(teamUids: Array<number>, isInvitation: boolean): Promise<void> {
        return Promise.all(teamUids.map(uid => this.contractManager.getTeamName(uid)))
        .then((teamNames: Array<string>) => {
            let teams;
            if (teamNames) {
                teams = teamUids.map((teamUid, i) => {
                    return new Team(teamUid, teamNames[i]);
                });
            }
            isInvitation ? this.invitationList = teams : this.teamList = teams;
        });
    }

    private checkNodesAndOpenHomePage (account: Account, currentNodeIndex: number): Promise<boolean> {
        let prom = Promise.resolve(false);
        let isAlreadyRegisteredToTeam;
        let allTeamUids;
        if(currentNodeIndex >= 0 && currentNodeIndex < AppConfig.NETWORK_CONFIG.length) {
            prom = this.contractManager.init(account, currentNodeIndex)
            .then(() => {
                this.log.d("Account set. Checking the node number: " + currentNodeIndex);
                return this.contractManager.getUserTeam();              
            })
            .then((teamUIds: Array<number>) => {
                allTeamUids = teamUIds;
                let promise;
                isAlreadyRegisteredToTeam = teamUIds.length !== 0;
                if (isAlreadyRegisteredToTeam) {
                    promise = this.getUserTeamAndInvitations(teamUIds[0], account.address, teamUIds);
                } else {
                    this.goToSetProfile.next(this.SET_PROFILE);
                }
                return true;
            })
            .catch((e) => {
                this.log.d("Failure to access the node " + currentNodeIndex);
                return(this.checkNodesAndOpenHomePage(account, currentNodeIndex + 1));
            });
        }
        return prom;
    }
}
