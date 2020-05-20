import { Component, Input } from "@angular/core";
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

    public readonly TEAM_NAME_MAX_LENGTH = 20;
    public readonly DEFAULT_SEASON_LENGTH = 14;
    public readonly MIN_SEASON_LENGTH_DAYS = AppConfig.MIN_SEASON_LENGTH_DAYS;
    public readonly MAX_SEASON_LENGTH_DAYS = AppConfig.MAX_SEASON_LENGTH_DAYS;
    public setProfileFg: FormGroup;
    public createTeamFg: FormGroup;
    public isButtonPressed: boolean;
    public msg: string;
    public teamList: Array<Team>;
    public showCreateTeam = false;
    public showTeamList = false;
    public areEmailsWellFormated = true;

    private readonly EMAILS_SEPARATOR = "\n";

    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        loggerSrv: LoggerService,
        public fb: FormBuilder,
        public translateService: TranslateService,
        public http: HttpClient,
        private contractManagerService: ContractManagerService,
        private avatarSrv: AvatarService
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
        this.isButtonPressed = false;
    }

    public updateProfile(name: string, email: string) {
        this.isButtonPressed = true;
        this.userEmail = email;
        this.userName = name;
        let isInvited;
        let allTeamUids;
        this.contractManagerService.isInvitedToTeam(email)
            .then((isInvitedToTeam: boolean) => {
                let promise;
                isInvited = isInvitedToTeam;
                if (isInvitedToTeam) {
                    promise = this.contractManagerService.getAllTeamInvitationsByEmail(email);
                } else {
                    this.showCreateTeam = true;
                    this.isButtonPressed = false;
                }
                return promise;
            })
            .then((teamUids: Array<number>) => {
                allTeamUids = teamUids;
                let promises: Array<Promise<string>>;
                let promise;
                if (isInvited) {
                    this.showTeamList = true;
                    promises = teamUids.map(teamUid => this.contractManagerService.getTeamName(teamUid));
                    promise = Promise.all(promises);
                } else {
                    promise =  Promise.resolve();
                }
                return promise;
            })
            .then((teamNames: Array<string>) => {
                if (teamNames) {
                    this.teamList = allTeamUids.map((teamUid, i) => {
                        return new Team(teamUid, teamNames[i]);
                    });
                }
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

    public registerToTeam(teamUid: number) {
        this.contractManagerService.registerToTeam(this.userEmail, teamUid)
        .then((uid: number) => {
            this.setContractsAndProfile(uid);
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
        this.isButtonPressed = true;
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
            this.isButtonPressed = false;
        }
    }

    private setContractsAndProfile(teamUid: number): Promise<void> {
        return this.contractManagerService.setBaseContracts(teamUid)
            .then(() => {
                return this.contractManagerService.setProfile(this.userName, this.userEmail);
            })
            .then(txResponse => {
                this.isButtonPressed = false;
                this.log.d("Contract manager response: ", txResponse);
                if (!txResponse) {
                    throw "Error: cannot set profile";
                }
                return this.contractManagerService.getAllUserAddresses();
            })
            .then((addresses: Array<string>) => {
                addresses.forEach(address => {
                    this.avatarSrv.addUser(address);
                });
                this.navCtrl.push(TabsPage);
            }).catch((e) => {
                this.translateService.get("setProfile.tx").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
    }
}

