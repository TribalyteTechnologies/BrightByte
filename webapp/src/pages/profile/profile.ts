import { HttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";
import { AlertController, ViewController } from "ionic-angular";
import { Observable } from "rxjs";
import { AppConfig } from "../../app.config";
import { FormatUtils } from "../../core/format-utils";
import { ILogger, LoggerService } from "../../core/logger.service";
import { LoginService } from "../../core/login.service";
import { SpinnerService } from "../../core/spinner.service";
import { AvatarService } from "../../domain/avatar.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { UserNameService } from "../../domain/user-name.service";
import { InvitedUser } from "../../models/invited-user.model";
import { IOrganizationResponse, IResponse, IWorkspaceResponse } from "../../models/response.model";
import { TeamMember } from "../../models/team-member.model";
import { UserDetails } from "../../models/user-details.model";

@Component({
    selector: "profile",
    templateUrl: "profile.html"
})

export class Profile {

    public readonly SETTINGS_CATEGORIES = ["Profile", "Team", "Providers"];
    public readonly ADMIN = AppConfig.UserType.Admin;
    public readonly MEMBER = AppConfig.UserType.Member;

    public avatarObs: Observable<string>;
    public avatarData: string;
    public imageSelected = false;
    public userName: string;
    public isErrorMsg: boolean;
    public isErrorRulesMsg: boolean;
    public isErrorNotificationMsg: boolean;
    public isErrorInviteMsg: boolean;
    public isErrorSeasonMsg: boolean;
    public isErrorworkspaceMsg: boolean;
    public isErrorOrganizationsMsg: boolean;
    public avatarMsg: string;
    public generalMsg: string;
    public rulesMsg: string;
    public notificationMsg: string;
    public inviteMsg: string;
    public seasonMsg: string;
    public workspaceMsg: string;
    public organizationMsg: string;
    public seasonErrorMsg: string;
    public uploadForm: FormGroup;
    public settingsCategory = this.SETTINGS_CATEGORIES[0];
    public teamName: string;
    public seasonLength: number;
    public memberType: AppConfig.UserType;
    public invitedEmail: string;
    public newTeamWorkspace: string;
    public newTeamOrganization: string;
    public isCurrentUserAdmin: boolean;
    public isSettingTeamName = false;
    public isInvitingUser = false;
    public isSettingSeasonData = false;
    public isSettingThreshold = false;
    public isLoadingInfo = true;
    public teamMembers: Array<Array<TeamMember>>;
    public invitedUsers: Array<InvitedUser>;
    public teamWorkspaces: Array<string>;
    public teamOrganizations: Array<string>;
    public isBitbucketAvailable = false;
    public isGithubAvailable = false;
    public commitThreshold: number;
    public reviewThreshold: number;
    public teamRules: string;
    public isRandomReviewers: boolean;
    public isBackendAvailable: boolean;

    private readonly UPDATE_IMAGE_URL = AppConfig.SERVER_BASE_URL + "/profile-image/upload?userHash=";
    private readonly IMAGE_FIELD_NAME = "image";
    private readonly USER_NAME_FIELD_NAME = "userName";
    private readonly EMAILS_SEPARATOR = /[\s,]+/;
    private readonly MAX_SIZE_IMAGE_MB = 2;
    private readonly MB_TO_BYTES = 1048576;
    private readonly MAX_SIZE_IMAGE_BYTES = this.MAX_SIZE_IMAGE_MB * this.MB_TO_BYTES;


    private userAddress: string;
    private userTeam: number;
    private isSettingSeason: boolean;
    private log: ILogger;
    private currentVersion: number;
    private initSeasonTimestamp: number;
    private isTooBigImage: boolean;


    constructor(
        loggerSrv: LoggerService,
        private http: HttpClient,
        private translateSrv: TranslateService,
        private loginSrv: LoginService,
        private viewCtrl: ViewController,
        private avatarSrv: AvatarService,
        private formBuilder: FormBuilder,
        private alertCtrl: AlertController,
        private contractManagerService: ContractManagerService,
        private spinnerService: SpinnerService,
        private userNameSrv: UserNameService
    ) {
        this.log = loggerSrv.get("ProfilePage");
        this.teamMembers = Array<Array<TeamMember>>();
        this.teamWorkspaces = Array<string>();
        this.teamOrganizations = Array<string>();
    }

    public ngOnInit() {
        this.userAddress = this.loginSrv.getAccountAddress();
        this.currentVersion = this.loginSrv.getCurrentVersion();
        this.isLoadingInfo = true;
        this.isBackendAvailable = true;
        this.avatarObs = this.avatarSrv.getAvatarObs(this.userAddress);
        this.uploadForm = this.formBuilder.group({
            image: [""],
            userName: this.formBuilder.control("")
        });
        this.contractManagerService.getUserDetails(this.userAddress)
        .then((user: UserDetails) => {
            this.userName = user.name;
            this.uploadForm.get(this.USER_NAME_FIELD_NAME).setValue(user.name);
            return this.contractManagerService.isCurrentUserAdmin();
        })
        .then((isAdmin: boolean) => {
            this.isCurrentUserAdmin = isAdmin;
            return this.contractManagerService.getCurrentTeamName();
        })
        .then((teamName: string) => {
            this.teamName = teamName;
            return this.contractManagerService.getInvitedUsersInfo();
        })
        .then((invitedUsers: Array<InvitedUser>) => {
            this.invitedUsers = invitedUsers;
            return this.contractManagerService.getTeamMembersInfo();
        }).then((teamMembers: Array<Array<TeamMember>>) => {
            this.teamMembers = teamMembers;
            return this.contractManagerService.getCurrentSeason();
        }).then((seasonState: Array<number>) => {
            this.isSettingSeason = Number(seasonState[0]) === 1;
            this.seasonLength = seasonState[2] / AppConfig.DAY_TO_SECS;
            this.initSeasonTimestamp = seasonState[1] - seasonState[2];
            this.log.d("Season init date in MS", this.initSeasonTimestamp);
            return this.contractManagerService.getCurrentSeasonThreshold();
        }).then(seasonThreshold => {
            this.log.d("The season thresholds are", seasonThreshold);
            this.commitThreshold = seasonThreshold[0];
            this.reviewThreshold = seasonThreshold[1];
            return this.contractManagerService.getCurrentTeam();
        }).then(userTeam => {
            this.userTeam = userTeam;
            return this.contractManagerService.getTextRules();
        }).then((teamRules: string) => {
            this.teamRules = teamRules;
            return this.contractManagerService.getRandomReviewer();
        }).then((isRandomReviewers: boolean) => {
            this.isRandomReviewers = isRandomReviewers;
            const url = AppConfig.TEAM_API + this.userTeam + "/" + this.currentVersion + AppConfig.WORKSPACE_PATH + this.userAddress;
            return this.http.get(url).toPromise();
        }).then((result: IWorkspaceResponse) => {
            this.log.d("The user worspaces are ", result);
            if (result.status !== "Error") {
                this.teamWorkspaces = result.data;
                this.isBitbucketAvailable = true;
            }
            const urlGithub = AppConfig.TEAM_API + this.userTeam + "/" + 
            this.currentVersion + AppConfig.ORGANIZATION_PATH + this.userAddress;
            return this.http.get(urlGithub).toPromise();
        }).then((result: IOrganizationResponse) => {
            this.log.d("The user worspaces are ", result);
            if (result.status !== "Error") {
                this.teamOrganizations = result.data;
                this.isGithubAvailable = true;
            }
            this.isLoadingInfo = false;
        }).catch(e => {
            this.log.e("Error: ", e);
            this.isBackendAvailable = this.isBitbucketAvailable || this.isGithubAvailable;
        });
    }

    public showRemoveMemberConfirmation(teamMember: TeamMember) {
        this.translateSrv.get(["setProfile.removeMember", "setProfile.removeMemberConfirmation", "setProfile.remove", "setProfile.cancel"])
            .subscribe((response) => {
                let removeMember = response["setProfile.removeMember"];
                let removeMemberConfirmation = response["setProfile.removeMemberConfirmation"];
                let remove = response["setProfile.remove"];
                let cancel = response["setProfile.cancel"];

                let alert = this.alertCtrl.create({
                    title: removeMember,
                    message: removeMemberConfirmation,
                    buttons: [
                        {
                            text: cancel,
                            role: "cancel",
                            handler: () => {
                                this.log.d("Cancel clicked");
                            }
                        },
                        {
                            text: remove,
                            handler: () => {
                                this.log.d("Remove clicked");
                                this.removeMember(teamMember);
                            }
                        }
                    ]
                });
                alert.present();
            });
    }

    public openFile(event: Event) {
        let target = <HTMLInputElement>event.target;
        let uploadedFiles = <FileList>target.files;
        let input = uploadedFiles[0];
        let fileSize = input.size;
        if(fileSize < this.MAX_SIZE_IMAGE_BYTES) {
            this.uploadForm.get(this.IMAGE_FIELD_NAME).setValue(input);
            this.getBase64(input).then((data: string) => {
                this.avatarData = data;
                this.imageSelected = true;
                this.avatarMsg = null;
            });
        } else {
            this.isTooBigImage = true;
            this.avatarMsg = "setProfile.tooBigImageError";
            this.isErrorMsg = true;
        }
    }

    public confirmImageRemove() {
        this.translateSrv.get(["setProfile.removeImage", "setProfile.removeConfirmation", "setProfile.remove", "setProfile.cancel"])
            .subscribe((response) => {
                let removeImage = response["setProfile.removeImage"];
                let removeConfirmation = response["setProfile.removeConfirmation"];
                let remove = response["setProfile.remove"];
                let cancel = response["setProfile.cancel"];

                let alert = this.alertCtrl.create({
                    title: removeImage,
                    message: removeConfirmation,
                    buttons: [
                        {
                            text: cancel,
                            role: "cancel",
                            handler: () => {
                                this.log.d("Cancel clicked");
                            }
                        },
                        {
                            text: remove,
                            handler: () => {
                                this.log.d("Remove clicked");
                                this.deleteAvatar();
                            }
                        }
                    ]
                });
                alert.present();
            });
    }

    public saveProfileChange() {
        let userName = this.uploadForm.get(this.USER_NAME_FIELD_NAME).value;
        let promises = new Array<Promise<any>>();
        this.avatarMsg = null;
        if (userName && userName !== this.userName) {
            let promise = this.contractManagerService.setUserName(userName).then(() => {
                this.log.d("The user has set a new name");
                this.userNameSrv.updateName(userName);
                this.avatarMsg = "setProfile.successMessageName";
                this.isErrorMsg = false;
            }).catch(e => {
                this.log.e("Error setting the new user name: ", e);
                this.avatarMsg = "setProfile.changeNameError";
                this.isErrorMsg = true;
            });
            promises.push(promise);
        }
        if (this.imageSelected) {
            let formData = new FormData();
            formData.append(this.IMAGE_FIELD_NAME, this.uploadForm.get(this.IMAGE_FIELD_NAME).value);
            let promise = this.http.post(this.UPDATE_IMAGE_URL + this.userAddress, formData).toPromise()
                .then((response: IResponse) => {
                    if (response.status === AppConfig.STATUS_OK) {
                        this.avatarSrv.updateUrl(this.userAddress, AppConfig.SERVER_BASE_URL + response.data);
                        this.avatarMsg = "setProfile.successMessageAvatar";
                        this.isErrorMsg = false;
                    }
                }).catch(e => {
                    this.log.e("Error setting the new user avatar: ", e);
                    this.avatarMsg = "setProfile.uploadError";
                    this.isErrorMsg = true;
                });
            promises.push(promise);
        }
        if (promises.length > 0) {
            this.spinnerService.showLoader();
            Promise.all(promises).then(() => {
                this.log.d("The user profile changed his profile");
                this.spinnerService.hideLoader();
                if (!this.avatarMsg) {
                    this.dismiss();
                }
            });
        } else if(this.isTooBigImage) {
            this.avatarMsg = "setProfile.tooBigImageError";
            this.isErrorMsg = true;
        } else {
            this.avatarMsg = "setProfile.noChangesError";
            this.isErrorMsg = true;
        }
    }

    public changeTextRules(rules: string) {
        this.rulesMsg = null;
        this.contractManagerService.changeTextRules(rules)
        .then(() => {
            this.rulesMsg = "setProfile.successTeamRulesChange";
            this.isErrorRulesMsg = false;
            this.teamRules = rules;
        })
        .catch(e => {
            this.rulesMsg = "setProfile.changeTextRuleError";
            this.isErrorRulesMsg = true;
        });
    }

    public changeTeamName(teamName: string) {
        this.teamName = teamName;
        this.spinnerService.showLoader();
        this.generalMsg = null;
        this.isSettingTeamName = true;
        this.contractManagerService.changeTeamName(teamName)
        .then(() => {
            this.isSettingTeamName = false;
            this.generalMsg = "setProfile.successTeamNameChange";
            this.isErrorMsg = false;
            this.spinnerService.hideLoader();
        })
        .catch(e => {
            this.isSettingTeamName = false;
            this.generalMsg = "setProfile.changeTeamNameError";
            this.isErrorMsg = true;
            this.spinnerService.hideLoader();
        });
    }

    public changeSeasonLength(seasonLength: number) {
        this.seasonLength = seasonLength;
        this.seasonMsg = null;
        const seasonLengthInMS = seasonLength * AppConfig.DAY_TO_SECS;
        const timeElapsed = (Date.now() / AppConfig.SECS_TO_MS) - this.initSeasonTimestamp;
        if (seasonLengthInMS > timeElapsed){
            if (seasonLength >= AppConfig.MIN_SEASON_LENGTH_DAYS && seasonLength < AppConfig.MAX_SEASON_LENGTH_DAYS) {
                this.isSettingSeasonData = true;
                this.contractManagerService.setSeasonLength(this.seasonLength)
                .then(() => {
                    this.isSettingSeasonData = false;
                    this.seasonMsg = "setProfile.seasonLengthSuccessMsg";
                    this.isErrorSeasonMsg = false;
                }).catch(e => {
                    this.log.e("Error setting the new season duration", e);
                    this.isSettingSeasonData = false;
                    this.seasonMsg = "setProfile.seasonLengthErrorMsg";
                    this.isErrorSeasonMsg = true;
                });
            } else {   
                this.seasonMsg = "setProfile.seasonLengthErrorMsg";
                this.isErrorSeasonMsg = true; 
            }
        } else {
            this.seasonMsg = "setProfile.seasonChangeError";
            this.isErrorSeasonMsg = true;
        }
    }

    public inviteUsersToTeam(invitedEmails: string, userType: AppConfig.UserType) {
        let areEmailsWellFormated = true;
        this.inviteMsg = null;
        let emails = invitedEmails.split(this.EMAILS_SEPARATOR).map(email => {
            let mail = email.trim();
            if (areEmailsWellFormated && mail !== "") {
                areEmailsWellFormated = FormatUtils.getEmailValidatorPattern().test(mail);
            }
            return mail;
        }).filter(email => email !== "");
        let isEmailAlreadyRegistered = this.teamMembers.some(memberGroup => {
            return memberGroup.some(member => {
                return emails.some(email => email === member.email);
            });
        });
        if (areEmailsWellFormated) {
            if (!isEmailAlreadyRegistered) {
                if (userType) {
                    this.isInvitingUser = true;
                    this.contractManagerService.inviteToCurrentTeam(emails, userType)
                    .then(() => {
                        this.isInvitingUser = false;
                        let newInvitedUsers = new Array<InvitedUser>();
                        emails.forEach(email => {
                            let expDateMilis = Math.round((Date.now() / AppConfig.SECS_TO_MS) 
                            + AppConfig.DEFAULT_INVITATION_EXP_IN_SECS);
                            let emailsAlreadyInvited = this.invitedUsers.filter(user => user.email === email);
                            let newUser = new InvitedUser(email, expDateMilis, userType);
                            if (emailsAlreadyInvited.length > 0) {
                                let index = this.invitedUsers.indexOf(emailsAlreadyInvited[0]);
                                this.invitedUsers[index] = newUser;
                            } else {
                                newInvitedUsers.push(newUser);
                            }
                        });
                        this.invitedUsers = this.invitedUsers.concat(newInvitedUsers);
                        this.inviteMsg = "setProfile.successInvitation";
                        this.isErrorInviteMsg = false;
                    })
                    .catch(e => {
                        this.isInvitingUser = false;
                        this.inviteMsg = "setProfile.invitationError";
                        this.isErrorInviteMsg = true;
                    });
                } else {
                    this.inviteMsg = "setProfile.userTypeError";
                    this.isErrorInviteMsg = true;
                }
            } else {
                this.inviteMsg = "setProfile.alreadyRegisteredError";
                this.isErrorInviteMsg = true;
            }
        } else {
            this.inviteMsg = "setProfile.invitationEmailFormatError";
            this.isErrorInviteMsg = true;
        }
    }

    public showRemoveInivitationConfirmation(invitedUser: InvitedUser) {
        this.translateSrv.get(["setProfile.removeInvitation", "setProfile.removeInvitationConfirmation", "setProfile.remove", "setProfile.cancel"])
            .subscribe((response) => {
                let removeInvitation = response["setProfile.removeInvitation"];
                let removeInvitationConfirmation = response["setProfile.removeInvitationConfirmation"];
                let remove = response["setProfile.remove"];
                let cancel = response["setProfile.cancel"];

                let alert = this.alertCtrl.create({
                    title: removeInvitation,
                    message: removeInvitationConfirmation,
                    buttons: [
                        {
                            text: cancel,
                            role: "cancel",
                            handler: () => {
                                this.log.d("Cancel clicked");
                            }
                        },
                        {
                            text: remove,
                            handler: () => {
                                this.log.d("Remove clicked");
                                this.removeInvitation(invitedUser);
                            }
                        }
                    ]
                });
                alert.present();
            });
    }

    public addNewWorkspace(workspace: string) {
        this.workspaceMsg = null;
        let workspaceIndex = this.teamWorkspaces.indexOf(workspace);
        if (workspace && workspaceIndex === -1) {
            const url = AppConfig.TEAM_API + this.userTeam + "/" + this.currentVersion + AppConfig.WORKSPACE_PATH + workspace;
            this.http.post(url, {}).toPromise().then((response: IResponse) => {
                this.log.d("Added new workspace for the team");
                this.teamWorkspaces.push(workspace);
                this.workspaceMsg = "setProfile.newWorkspaceSuccessMsg";
                this.isErrorworkspaceMsg = false;
            }).catch(e => {
                this.log.e("Error setting the new team workspace: ", e);
                this.workspaceMsg = "setProfile.newWorkspaceError";
                this.isErrorworkspaceMsg = true;
            });
        } else {
            this.workspaceMsg = "setProfile.invalidWorkspace";
            this.isErrorworkspaceMsg = true;
        }
    }

    public addNewOrganization(organization: string) {
        this.organizationMsg = null;
        let organizationIndex = this.teamOrganizations.indexOf(organization);
        if (organization && organizationIndex === -1) {
            const url = AppConfig.TEAM_API + this.userTeam + "/" + this.currentVersion  + AppConfig.ORGANIZATION_PATH + organization;
            this.http.post(url, {
            }).toPromise().then((response: IResponse) => {
                this.log.d("Added new organization for the team");
                this.teamOrganizations.push(organization);
                this.organizationMsg = "setProfile.newOrganizationSuccessMsg";
                this.isErrorOrganizationsMsg = false;
            }).catch(e => {
                this.log.e("Error setting the new team organization: ", e);
                this.organizationMsg = "setProfile.newOrganizationError";
                this.isErrorOrganizationsMsg = true;
            });
        } else {
                this.organizationMsg = "setProfile.invalidOrganization";
                this.isErrorOrganizationsMsg = true;
        }
    }

    public showRemoveWorkspaceConfirmation(workspace: string) {
        this.translateSrv.get(["setProfile.removeWorkspace", "setProfile.removeWorkspaceConfirmation", "setProfile.remove", "setProfile.cancel"])
        .subscribe((response) => {
            let removeWorkspace = response["setProfile.removeWorkspace"];
            let removeWorkspaceConfirmation = response["setProfile.removeWorkspaceConfirmation"];
            let remove = response["setProfile.remove"];
            let cancel = response["setProfile.cancel"];

            let alert = this.alertCtrl.create({
                title: removeWorkspace,
                message: removeWorkspaceConfirmation,
                buttons: [
                    {
                        text: cancel,
                        role: "cancel",
                        handler: () => {
                            this.log.d("Cancel clicked");
                        }
                    },
                    {
                        text: remove,
                        handler: () => {
                            this.log.d("Remove clicked");
                            this.removeTeamWorkspace(workspace);
                        }
                    }
                ]
            });
            alert.present();
        });
    }

    public showRemoveOrganizationConfirmation(organization: string) {
        this.translateSrv.get(["setProfile.removeOrganization", "setProfile.removeOrganizationConfirmation", "setProfile.remove", "setProfile.cancel"])
        .subscribe((response) => {
            let removeOrganization = response["setProfile.removeOrganization"];
            let removeOrganizationConfirmation = response["setProfile.removeOrganizationConfirmation"];
            let remove = response["setProfile.remove"];
            let cancel = response["setProfile.cancel"];

            let alert = this.alertCtrl.create({
                title: removeOrganization,
                message: removeOrganizationConfirmation,
                buttons: [
                    {
                        text: cancel,
                        role: "cancel",
                        handler: () => {
                            this.log.d("Cancel clicked");
                        }
                    },
                    {
                        text: remove,
                        handler: () => {
                            this.log.d("Remove clicked");
                            this.removeTeamOrganization(organization);
                        }
                    }
                ]
            });
            alert.present();
        });
    }

    public changeSeasonThreshold(commitThreshold: number, reviewThreshold: number) {
        this.commitThreshold = commitThreshold;
        this.reviewThreshold = reviewThreshold;
        if (this.commitThreshold >= 0 && this.reviewThreshold >= 0) {
            this.isSettingSeasonData = true;
            this.contractManagerService.setCurrentSeasonThreshold(this.commitThreshold, this.reviewThreshold)
            .then(res => {
                this.seasonMsg = "setProfile.successSettingThreshold";
                this.isErrorMsg = false;
                this.isSettingSeasonData = false;
            }).catch(e => {
                this.seasonMsg = "setProfile.errorSettingThreshold";
                this.isErrorMsg = true;
                this.isSettingSeasonData = false;
            });
        } else {
            this.seasonErrorMsg = "setProfile.invalidThreshold";
            this.isErrorMsg = true;
        }
    }


    public pressToggleRandomReviewers() {
        this.contractManagerService.setRandomReviewer(this.isRandomReviewers);
    }

    public sendNotification() {
        this.notificationMsg = null;
        let promises = this.teamMembers.map(teams => 
            teams.map(teamMember =>  {
                return this.contractManagerService.getUserPendingReviews(teamMember.address)
                .then((pendingReviews: number) => {
                    if(pendingReviews > 0) {
                        this.http.post(
                        AppConfig.TEAM_API + teamMember.email + "/" + this.teamName + AppConfig.NOTIFICATION_PATH + pendingReviews, {}
                        ).toPromise();
                    }
                    this.notificationMsg = "setProfile.successNotification";
                    this.isErrorNotificationMsg = false;
                })
                .catch(e => {
                    this.notificationMsg = "setProfile.sendNotificationError";
                    this.isErrorNotificationMsg = true;
                });    
            }) 
        );
        return Promise.all(promises);
    }

    private removeTeamWorkspace(workspace: string) {
        this.log.d("The user admin requested to deleted the workspace: ", workspace);
        let workspaceIndex = this.teamWorkspaces.indexOf(workspace);
        if (workspaceIndex >= 0) {
            const url = AppConfig.TEAM_API + this.userTeam + "/" + this.currentVersion + AppConfig.WORKSPACE_PATH + workspace;
            this.http.delete(url, {}).toPromise().then(result => {
                this.teamWorkspaces.splice(workspaceIndex, 1);
                this.workspaceMsg = "setProfile.removeWorkspaceSuccessMsg";
                this.isErrorworkspaceMsg = false;
            }).catch(e => {
                this.log.e("Error deleting the team workspace: ", e); 
                this.workspaceMsg = "setProfile.deleteWorkspaceError";
                this.isErrorworkspaceMsg = true;
            });
        }

    }

    private removeTeamOrganization(organization: string) {
        this.log.d("The user admin requested to deleted the organization: ", organization);
        let organizationIndex = this.teamOrganizations.indexOf(organization);
        if (organizationIndex >= 0) {
            const url = AppConfig.TEAM_API + this.userTeam + "/" + this.currentVersion + AppConfig.ORGANIZATION_PATH + organization;
            this.http.delete(url, {})
            .toPromise().then(result => {
                this.teamOrganizations.splice(organizationIndex, 1);
                this.organizationMsg = "setProfile.removeOrganizationSuccessMsg";
                this.isErrorOrganizationsMsg = false;
            }).catch(e => {
                this.log.e("Error deleting the team organization: ", e);
                this.organizationMsg = "setProfile.deleteOrganizationError";
                this.isErrorOrganizationsMsg = true;
            });
        }

    }

    private removeInvitation(invitedUser: InvitedUser) {
        this.contractManagerService.removeInvitation(invitedUser.email)
        .then(() => {
            let invitationIndex = this.invitedUsers.indexOf(invitedUser);
            this.invitedUsers.splice(invitationIndex, 1);
        });
    }

    private removeMember(teamMember: TeamMember) {
        this.contractManagerService.removeTeamMember(teamMember.address)
        .then(() => {
            let memberType = teamMember.userType - 1;
            let memberIndex = this.teamMembers[memberType].indexOf(teamMember);
            this.teamMembers[memberType].splice(memberIndex, 1);
        });
    }

    private deleteAvatar() {
        this.log.d("Request to delete profile avatar");
        this.http.get(AppConfig.PROFILE_IMAGE_URL + this.userAddress + AppConfig.AVATAR_STATUS_PATH).
            flatMap((response: IResponse) => {
                let ret: Observable<Object> = Observable.empty<IResponse>();
                if (response && response.status === AppConfig.STATUS_OK) {
                    this.log.d("Enable to delete the user avatar");
                    ret = this.http.delete(AppConfig.PROFILE_IMAGE_URL + this.userAddress);
                } else {
                    this.log.d("User already has his default avatar");
                    this.avatarMsg = "setProfile.defaultError";
                    this.isErrorMsg = true;
                }
                return ret;
            }).
            subscribe(
                (response: IResponse) => {
                    if (response && response.status === AppConfig.STATUS_OK) {
                        this.avatarData = AppConfig.IDENTICON_URL + this.userAddress + AppConfig.IDENTICON_FORMAT;
                        this.log.d("Changed the avatar to default one " + this.avatarData);
                        this.avatarSrv.updateUrl(this.userAddress);
                        this.dismiss();
                    }
                }, 
                error => {
                    this.avatarMsg = "setProfile.defaultError"; 
                    this.isErrorMsg = true; 
                    throw error;          
                });
    }

    private getBase64(file: File): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    private dismiss() {
        this.viewCtrl.dismiss();
    }
}
