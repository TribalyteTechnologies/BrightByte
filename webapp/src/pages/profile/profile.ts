import { Component } from "@angular/core";
import { ViewController, AlertController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../../app.config";
import { TranslateService } from "@ngx-translate/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ILogger, LoggerService } from "../../core/logger.service";
import { catchError, flatMap } from "rxjs/operators";
import { Observable } from "rxjs";
import { AvatarService } from "../../domain/avatar.service";
import { IResponse, IWorkspaceResponse } from "../../models/response.model";
import { LoginService } from "../../core/login.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { SpinnerService } from "../../core/spinner.service";
import { UserNameService } from "../../domain/user-name.service";
import { UserDetails } from "../../models/user-details.model";
import { TeamMember } from "../../models/team-member.model";
import { FormatUtils } from "../../core/format-utils";
import { InvitedUser } from "../../models/invited-user.model";
import { from } from "rxjs/observable/from";

@Component({
    selector: "profile",
    templateUrl: "profile.html"
})

export class Profile {

    public readonly SETTINGS_CATEGORIES = ["Profile", "Team"];
    public readonly ADMIN = AppConfig.UserType.Admin;
    public readonly MEMBER = AppConfig.UserType.Member;

    public avatarObs: Observable<string>;
    public avatarData: string;
    public imageSelected = false;
    public userName: string;
    public errorMsg: string;
    public errorInviteMsg: string;
    public errorRulesMsg: string;
    public successMsg: string;
    public successRulesMsg: string;
    public successInviteMsg: string;
    public seasonSuccessMsg: string;
    public workspaceErrorMsg: string;
    public workspaceSuccessMsg: string;
    public seasonErrorMsg: string;
    public uploadForm: FormGroup;
    public settingsCategory = this.SETTINGS_CATEGORIES[0];
    public teamName: string;
    public seasonLength: number;
    public memberType: AppConfig.UserType;
    public invitedEmail: string;
    public newTeamWorkspace: string;
    public isCurrentUserAdmin: boolean;
    public isSettingTeamName = false;
    public isInvitingUser = false;
    public isSettingSeasonData = false;
    public isSettingThreshold = false;
    public isLoadingInfo = true;
    public teamMembers: Array<Array<TeamMember>>;
    public invitedUsers: Array<InvitedUser>;
    public teamWorkspaces: Array<string>;
    public isBackendAvailable = true;
    public commitThreshold: number;
    public reviewThreshold: number;
    public teamRules: string;
    public randomReviewers: boolean;

    private readonly UPDATE_IMAGE_URL = AppConfig.SERVER_BASE_URL + "/profile-image/upload?userHash=";
    private readonly WORKSPACE = "/workspace/";
    private readonly IMAGE_FIELD_NAME = "image";
    private readonly USER_NAME_FIELD_NAME = "userName";
    private readonly EMAILS_SEPARATOR = /[\s,]+/;


    private noChangesError: string;
    private uploadError: string;
    private defaultError: string;
    private successMessageName: string;
    private successMessageTeamName: string;
    private successMessageTeamRules: string;
    private successMessageAvatar: string;
    private successMessageInvitation: string;
    private changeNameError: string;
    private changeTeamNameError: string;
    private changeTextRuleError: string;
    private invitationError: string;
    private invitationEmailFormatError: string;
    private userTypeError: string;
    private alreadyRegisteredError: string;
    private userAddress: string;
    private userTeam: number;
    private isSettingSeason: boolean;
    private log: ILogger;


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
    }

    public ngOnInit() {
        this.userAddress = this.loginSrv.getAccountAddress();
        this.isLoadingInfo = true;
        this.avatarObs = this.avatarSrv.getAvatarObs(this.userAddress);
        this.translateSrv.get([
            "setProfile.uploadError",
            "setProfile.defaultError",
            "setProfile.noChangesError",
            "setProfile.successMessageName",
            "setProfile.successMessageAvatar",
            "setProfile.successInvitation",
            "setProfile.changeNameError",
            "setProfile.changeTeamNameError",
            "setProfile.succesTeamNameChange",
            "setProfile.changeTextRuleError",
            "setProfile.succesTeamRulesChange",
            "setProfile.invitationError",
            "setProfile.invitationEmailFormatError",
            "setProfile.alreadyRegisteredError",
            "setProfile.userTypeError"])
            .subscribe(translation => {
                this.uploadError = translation["setProfile.uploadError"];
                this.defaultError = translation["setProfile.defaultError"];
                this.noChangesError = translation["setProfile.noChangesError"];
                this.successMessageName = translation["setProfile.successMessageName"];
                this.successMessageTeamName = translation["setProfile.succesTeamNameChange"];
                this.successMessageTeamRules = translation["setProfile.succesTeamRulesChange"],
                    this.successMessageAvatar = translation["setProfile.successMessageAvatar"];
                this.successMessageInvitation = translation["setProfile.successInvitation"];
                this.changeNameError = translation["setProfile.changeNameError"];
                this.changeTeamNameError = translation["setProfile.changeTeamNameError"];
                this.changeTextRuleError = translation["setProfile.changeTextRuleError"];
                this.invitationError = translation["setProfile.invitationError"];
                this.invitationEmailFormatError = translation["setProfile.invitationEmailFormatError"];
                this.userTypeError = translation["setProfile.userTypeError"];
                this.alreadyRegisteredError = translation["setProfile.alreadyRegisteredError"];
            });
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
            }).then((randomReviewers: boolean) => {
                this.randomReviewers = randomReviewers;
                return this.http.get(AppConfig.TEAM_API + this.userTeam + this.WORKSPACE + this.userAddress).toPromise();
            }).then((result: IWorkspaceResponse) => {
                this.isBackendAvailable = false;
                if (result.status !== "Error") {
                    this.teamWorkspaces = result.data;
                    this.isBackendAvailable = true;
                }
                this.isLoadingInfo = false;
            }).catch(e => {
                this.log.e("Error: ", e);
                this.isBackendAvailable = false;
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
        this.uploadForm.get(this.IMAGE_FIELD_NAME).setValue(input);
        this.getBase64(input).then((data: string) => {
            this.avatarData = data;
            this.imageSelected = true;
            this.errorMsg = null;
        });
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
        this.errorMsg = null;
        this.successMsg = null;
        if (userName && userName !== this.userName) {
            let promise = this.contractManagerService.setUserName(userName).then(() => {
                this.log.d("The user has set a new name");
                this.userNameSrv.updateName(userName);
                this.successMsg = this.successMessageName;
            }).catch(e => {
                this.log.e("Error setting the new user name: ", e);
                this.errorMsg = this.changeNameError;
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
                        this.successMsg = this.successMessageAvatar;
                    }
                }).catch(e => {
                    this.log.e("Error setting the new user avatar: ", e);
                    this.errorMsg = this.uploadError;
                });
            promises.push(promise);
        }
        if (promises.length > 0) {
            this.spinnerService.showLoader();
            Promise.all(promises).then(() => {
                this.log.d("The user profile changed his profile");
                this.spinnerService.hideLoader();
                if (!this.errorMsg) {
                    this.dismiss();
                }
            });
        } else {
            this.errorMsg = this.noChangesError;
        }
    }

    public changeTextRules(rules: string) {
        this.successRulesMsg = null;
        this.errorRulesMsg = null;
        this.contractManagerService.changeTextRules(rules)
            .then(() => {
                this.successRulesMsg = this.successMessageTeamRules;
                this.teamRules = rules;
            })
            .catch(e => {
                this.errorRulesMsg = this.changeTextRuleError;
            });
    }

    public changeTeamName(teamName: string) {
        this.teamName = teamName;
        this.errorMsg = null;
        this.successMsg = null;
        this.isSettingTeamName = true;
        this.contractManagerService.changeTeamName(teamName)
            .then(() => {
                this.isSettingTeamName = false;
                this.successMsg = this.successMessageTeamName;
            })
            .catch(e => {
                this.isSettingTeamName = false;
                this.errorMsg = this.changeTeamNameError;
            });
    }

    public changeSeasonLength(seasonLength: number) {
        this.seasonLength = seasonLength;
        this.seasonErrorMsg = null;
        this.seasonSuccessMsg = null;
        if (seasonLength >= AppConfig.MIN_SEASON_LENGTH_DAYS && seasonLength < AppConfig.MAX_SEASON_LENGTH_DAYS) {
            this.isSettingSeasonData = true;
            this.contractManagerService.setSeasonLength(this.seasonLength)
                .then(() => {
                    this.isSettingSeasonData = false;
                    return this.translateSrv.get("setProfile.seasonLengthSuccessMsg").toPromise();
                }).then(res => {
                    this.seasonSuccessMsg = res;
                }).catch(e => {
                    this.log.e("Error setting the new season duration", e);
                    this.isSettingSeasonData = false;
                    return this.translateSrv.get("setProfile.seasonLengthErrorMsg").toPromise();
                }).then(res => {
                    this.seasonErrorMsg = res;
                });
        } else {
            this.translateSrv.get("setProfile.seasonLengthErrorMsg").subscribe(res => {
                this.seasonErrorMsg = res;
            });
        }
    }

    public inviteUsersToTeam(invitedEmails: string, userType: AppConfig.UserType) {
        let areEmailsWellFormated = true;
        this.successInviteMsg = null;
        this.errorInviteMsg = null;
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
                            this.successInviteMsg = this.successMessageInvitation;
                        })
                        .catch(e => {
                            this.isInvitingUser = false;
                            this.errorInviteMsg = this.invitationError;
                        });
                } else {
                    this.errorInviteMsg = this.userTypeError;
                }
            } else {
                this.errorInviteMsg = this.alreadyRegisteredError;
            }
        } else {
            this.errorInviteMsg = this.invitationEmailFormatError;
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
        this.workspaceErrorMsg = null;
        this.workspaceSuccessMsg = null;
        let workspaceIndex = this.teamWorkspaces.indexOf(workspace);
        if (workspace && workspaceIndex === -1) {
            this.http.post(AppConfig.TEAM_API + this.userTeam + this.WORKSPACE + workspace, {}).toPromise().then((response: IResponse) => {
                this.log.d("Added new workspace for the team");
                this.teamWorkspaces.push(workspace);
                this.translateSrv.get("setProfile.newWorkspaceSuccessMsg").subscribe(res => {
                    this.workspaceSuccessMsg = res;
                });
            }).catch(e => {
                this.log.e("Error setting the new team workspace: ", e);
                this.translateSrv.get("setProfile.newWorkspaceError").subscribe(res => {
                    this.workspaceErrorMsg = res;
                });
            });
        } else {
            this.translateSrv.get("setProfile.invalidWorkspace").subscribe(res => {
                this.workspaceErrorMsg = res;
            });
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

    public changeSeasonThreshold(commitThreshold: number, reviewThreshold: number) {
        let error: boolean;
        this.commitThreshold = commitThreshold;
        this.reviewThreshold = reviewThreshold;
        if (this.commitThreshold >= 0 && this.reviewThreshold >= 0) {
            this.isSettingSeasonData = true;
            from(this.contractManagerService.setCurrentSeasonThreshold(this.commitThreshold, this.reviewThreshold)).pipe(
                flatMap(res => {
                    this.log.d("The user has set a new threshold");
                    return this.translateSrv.get("setProfile.successSettingThreshold");
                }),
                catchError(e => {
                    this.log.e("Error: ", e);
                    error = true;
                    return this.translateSrv.get("setProfile.errorSettingThreshold");
                })
            ).subscribe((res: string) => {
                this.isSettingSeasonData = false;
                if (error) {
                    this.seasonErrorMsg = res;
                } else {
                    this.seasonSuccessMsg = res;
                }

            });
        } else {
            this.translateSrv.get("setProfile.invalidThreshold").subscribe(res => {
                this.seasonErrorMsg = res;
            });
        }
    }

    public changeToggle() {
        this.contractManagerService.setRandomReviewer(this.randomReviewers);
    }

    private removeTeamWorkspace(workspace: string) {
        this.log.d("The user admin requested to deleted the workspace: ", workspace);
        let workspaceIndex = this.teamWorkspaces.indexOf(workspace);
        if (workspaceIndex !== -1) {
            this.http.delete(AppConfig.TEAM_API + this.userTeam + this.WORKSPACE + workspace, {}).toPromise().then(result => {
                this.teamWorkspaces.splice(workspaceIndex, 1);
                this.translateSrv.get("setProfile.removeWorkspaceSuccessMsg").subscribe(res => {
                    this.workspaceSuccessMsg = res;
                });
            }).catch(e => {
                this.log.e("Error deleting the team workspace: ", e);
                this.translateSrv.get("setProfile.deleteWorkspaceError").subscribe(res => {
                    this.workspaceErrorMsg = res;
                });
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
                    this.errorMsg = this.defaultError;
                }
                return ret;
            }).
            subscribe((response: IResponse) => {
                if (response && response.status === AppConfig.STATUS_OK) {
                    this.avatarData = AppConfig.IDENTICON_URL + this.userAddress + AppConfig.IDENTICON_FORMAT;
                    this.log.d("Changed the avatar to default one " + this.avatarData);
                    this.avatarSrv.updateUrl(this.userAddress);
                    this.dismiss();
                }
            }),
            catchError(error => this.errorMsg = this.defaultError);
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
