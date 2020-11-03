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

    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        loggerSrv: LoggerService,
        public fb: FormBuilder,
        public translateService: TranslateService,
        public http: HttpClient,
        private contractManagerService: ContractManagerService,
        private avatarSrv: AvatarService,
        private backendApiSrv: BackendApiService
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
            })
            .catch((e) => {
                this.translateService.get("setProfile.getEmails").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
                throw e;
            });
    }

    public registerToTeam(teamUid: number, version: number) {
        this.isRegistering = true;
        this.isSingingUp = true;
        this.contractManagerService.registerToTeam(this.userEmail, teamUid, version)
        .then((uid: number) => {
            this.setContractsAndProfile(uid, false);
        })
        .catch((e) => {
            this.isRegistering = false;
            this.translateService.get("setProfile.getEmails").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                });
            throw e;
        });
    }

    public createTeam(teamName: string, invitedEmails: string, seasonLength: number) {
        this.areEmailsWellFormated = true;
        let emails = invitedEmails.split(this.EMAILS_SEPARATOR).map(email => {
            let mail = email.trim();
            if (this.areEmailsWellFormated && mail !== ""){
                this.areEmailsWellFormated = FormatUtils.getEmailValidatorPattern().test(mail);
            }
            return mail;
        }).filter(email => email !== "");
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
        let currentVersion: number;
        return this.contractManagerService.setBaseContracts(teamUid)
            .then(() => {
                return this.contractManagerService.getCurrentVersionFromBase();
            })
            .then((version: number) => {
                currentVersion = version;
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
                this.backendApiSrv.initBackendConnection(teamUid, currentVersion);
                if (isCreatingTeam) {
                    this.showSetWorkspace();
                } else {
                    this.navCtrl.push(TabsPage);
                }
            }).catch((e) => {
                this.translateService.get("setProfile.tx").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
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
}

