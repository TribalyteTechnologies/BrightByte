import { Component, Input, Output, EventEmitter } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { TabsPage } from "../../pages/tabs/tabs";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";
import { FormatUtils } from "../../core/format-utils";
import { AppConfig } from "../../app.config";
import { AvatarService } from "../../domain/avatar.service";
import { Team } from "../../models/team.model";
import { BackendApiService } from "../../domain/backend-api.service";
import { MemberVersion } from "../../models/member-version.model";
import { PopupService } from "../../domain/popup.service";
import { LoginService } from "../../core/login.service";

@Component({
    selector: "set-profile-form",
    templateUrl: "set-profile-form.component.html",
    styles: ["set-profile-form.component.scss"]
})

export class SetProfileForm {

    @Input() 
    public userName: string;

    @Input()
    public userEmail: string;

    @Output()
    public goToSetWorkspace = new EventEmitter();

    public readonly TEAM_NAME_MAX_LENGTH = 20;
    public readonly DEFAULT_SEASON_LENGTH = 14;
    public readonly MIN_SEASON_LENGTH_DAYS = AppConfig.MIN_SEASON_LENGTH_DAYS;
    public readonly MAX_SEASON_LENGTH_DAYS = AppConfig.MAX_SEASON_LENGTH_DAYS;
    public setProfileFg: FormGroup;
    public createTeamFg: FormGroup;
    public isRegistering: boolean;
    public isSingingUp: boolean;
    public msg: string;
    public teamList: Array<Team>;
    public showCreateTeam = false;
    public showTeamList = false;
    public areEmailsWellFormated = true;

    private readonly EMAILS_SEPARATOR = "\n";
    private readonly SET_WORKSPACE_TAG = "set-workspace";
    private readonly BASE_URL = window.location.origin + "/";
    private readonly REGISTER_QUERY = "&" + AppConfig.UrlKey.REGISTERID + "=true";
    private readonly VERSION_QUERY = "?" + AppConfig.UrlKey.VERSIONID + "=";
    private readonly TEAM_QUERY = "&" + AppConfig.UrlKey.TEAMID + "=";
    private readonly USER_NAME_QUERY = "&" + AppConfig.UrlKey.USERNAMEID + "=";

    private log: ILogger;
    private version: number;

    constructor(
        public navCtrl: NavController,
        loggerSrv: LoggerService,
        public fb: FormBuilder,
        public translateService: TranslateService,
        public http: HttpClient,
        private contractManagerService: ContractManagerService,
        private avatarSrv: AvatarService,
        private backendApiSrv: BackendApiService,
        private popupSrv: PopupService,
        private loginService: LoginService
    ) {
        let emailValidator = FormatUtils.getEmailValidatorPattern();
        this.log = loggerSrv.get("SetProfilePage");
        this.setProfileFg = this.fb.group({
            name: ["", [Validators.required]],
            email: ["", [Validators.required, Validators.pattern(emailValidator)]]
        });
        this.createTeamFg = this.fb.group({
            teamName: ["", [Validators.required, Validators.maxLength(this.TEAM_NAME_MAX_LENGTH)]],
            invitedEmails: ["", [Validators.required]],
            seasonLength: [
                this.DEFAULT_SEASON_LENGTH,
                [Validators.required, Validators.min(this.MIN_SEASON_LENGTH_DAYS), Validators.max(this.MAX_SEASON_LENGTH_DAYS)]
            ]
        });
    }

    public ngOnInit() {
        if (this.userName && this.userEmail) {
            this.openCreateTeam();
        }
        this.contractManagerService.getCurrentVersion().then(res => this.version = res);
    }

    public openCreateTeam() {
        this.showCreateTeam = true;
        this.showTeamList = false;
        this.isRegistering = false;
    }

    public showSetWorkspace() {
        this.goToSetWorkspace.next(this.SET_WORKSPACE_TAG);
    }

    public updateProfile(name: string, email: string) {
        this.isRegistering = true;
        this.userEmail = email;
        this.userName = name;
        let isInvited;
        this.contractManagerService.getUserInvitedTeams(email)
            .then((invitedTeams: Array<MemberVersion>) => {
                isInvited = invitedTeams.length > 0;
                if (isInvited) {
                    this.showTeamList = true;
                } else {
                    this.showCreateTeam = true;
                    this.isRegistering = false;
                }
                return this.getTeams(invitedTeams);
            })
            .then((teamNames: Array<Team>) => {
                this.teamList = teamNames;
                this.sortTeams(this.teamList);
            })
            .catch((e) => {   
                this.msg = "setProfile.getEmails";
                this.log.e("Error getting emails", e);    
                throw e;
            });
    }

    public registerToTeam(teamUid: number, version: number) {
        this.isRegistering = true;
        this.isSingingUp = true;
        this.log.d("The user request to register to team:", teamUid, " in the version: ", version);
        if(this.version === version) {   
            this.contractManagerService.registerToTeam(this.userEmail, teamUid, version)
            .then((uid: number) => {
                this.loginService.setCurrentVersion(version);
                this.setContractsAndProfile(uid, false);
            })
            .catch((e) => {
                this.isRegistering = false;
                this.msg = "setProfile.getEmails";
                this.log.e("Error getting emails", e);    
                throw e;
            });
        } else {
            let urlToOpen = this.BASE_URL + version + "/" + this.VERSION_QUERY + version + 
            this.TEAM_QUERY + teamUid + this.REGISTER_QUERY + this.USER_NAME_QUERY + this.userName;
            this.popupSrv.openNewUrl(urlToOpen);
        }
    }

    public createTeam(teamName: string, invitedEmails: string, seasonLength: number) {
        this.areEmailsWellFormated = true;
        let emails = invitedEmails.split(this.EMAILS_SEPARATOR).map(email => {
            let mail = email.trim();
            if (this.areEmailsWellFormated && mail !== ""){
                this.areEmailsWellFormated = FormatUtils.getEmailValidatorPattern().test(mail);
            }
            return mail;
        }).filter(email => email !== "" && email !== this.userEmail);
        let teamUid;
        this.isRegistering = true;
        if (this.areEmailsWellFormated) {
            this.contractManagerService.createTeam(this.userEmail, teamName, seasonLength)
                .then((teamId: number) => {
                    teamUid = teamId;
                    return this.contractManagerService.inviteMultipleEmailsToTeam(
                        teamUid, emails, AppConfig.UserType.Member, AppConfig.DEFAULT_INVITATION_EXP_IN_SECS);
                })
                .then(() => {
                    return this.setContractsAndProfile(teamUid);
                });
        } else {
            this.isRegistering = false;
        }
    }

    private setContractsAndProfile(teamUid: number, isCreatingTeam = true): Promise<void> {
        return this.contractManagerService.setBaseContracts(teamUid)
            .then(() => {
                return this.contractManagerService.getCurrentVersionFromBase();
            })
            .then((version: number) => {
                this.version = version;
                this.loginService.setCurrentVersion(this.version);
                return this.contractManagerService.setProfile(this.userName, this.userEmail);
            })
            .then(txResponse => {
                this.isRegistering = false;
                this.log.d("Contract manager response: ", txResponse);
                return this.contractManagerService.getAllUserAddresses();
            })
            .then((addresses: Array<string>) => {
                addresses.forEach(address => {
                    this.avatarSrv.addUser(address);
                });
                this.backendApiSrv.initBackendConnection(teamUid, this.version);
                if (isCreatingTeam) {
                    this.showSetWorkspace();
                } else {
                    this.navCtrl.push(TabsPage);
                }
            }).catch((e) => {
                this.msg = "setProfile.tx";
                this.log.e("Transaction error", e);
            });
    }

    private getTeams(userTeams: Array<MemberVersion>): Promise<Array<Team>> {
        let promises = userTeams.map(version => {
            let ret = version.teamUids.map(uid => this.contractManagerService.getVersionTeamName(uid, version.version));
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
            return teams;
        }).catch(e => {
            this.log.e("Error getting teams info", e);
            return e;
        });
    }
    private sortTeams(teams: Array<Team>): Array<Team> {
        teams.sort((team1, team2) => (team2.version - team1.version) !== 0 ? (team2.version - team1.version) : (team2.uid - team1.uid));
        return teams;
    }
}

