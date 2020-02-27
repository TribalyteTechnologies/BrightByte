import { Component } from "@angular/core";
import { ViewController, AlertController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../../app.config";
import { TranslateService } from "@ngx-translate/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ILogger, LoggerService } from "../../core/logger.service";
import { catchError } from "rxjs/operators";
import { Observable } from "rxjs";
import { AvatarService } from "../../domain/avatar.service";
import { IResponse } from "../../models/response.model";
import { LoginService } from "../../core/login.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { SpinnerService } from "../../core/spinner.service";

@Component({
    selector: "profile",
    templateUrl: "profile.html"
})

export class Profile {

    public avatarObs: Observable<string>;
    public avatarData: string;
    public imageSelected = false;
    public userName: string;
    public errorMsg: string;
    public successMsg: string;
    public uploadForm: FormGroup;

    private readonly UPDATE_IMAGE_URL = AppConfig.SERVER_BASE_URL + "/profile-image/upload?userHash=";
    private readonly IMAGE_FIELD_NAME = "image";
    private readonly USER_NAME_FIELD_NAME = "userName";

    private noChangesError: string;
    private uploadError: string;
    private defaultError: string;
    private successMessageName: string;
    private successMessageAvatar: string;
    private changeNameError: string;
    private userAddress: string;
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
        private spinnerService: SpinnerService
    ) {
        this.log = loggerSrv.get("ProfilePage");
    }

    public ngOnInit() {
        this.userAddress = this.loginSrv.getAccountAddress();
        this.avatarObs = this.avatarSrv.getAvatarObs(this.userAddress);
        this.translateSrv.get([
            "setProfile.uploadError",
            "setProfile.defaultError",
            "setProfile.noChangesError",
            "setProfile.successMessageName", 
            "setProfile.successMessageAvatar", 
            "setProfile.changeNameError"])
        .subscribe(translation => {
            this.uploadError = translation["setProfile.uploadError"];
            this.defaultError = translation["setProfile.defaultError"];
            this.noChangesError = translation["setProfile.noChangesError"];
            this.successMessageName =  translation["setProfile.successMessageName"];
            this.successMessageAvatar =  translation["setProfile.successMessageAvatar"];
            this.changeNameError =  translation["setProfile.changeNameError"];
        });
        this.uploadForm = this.formBuilder.group({
            image: [""],
            userName: this.formBuilder.control("")
        });

        this.contractManagerService.getUserDetails(this.userAddress)
        .then(user => {
            this.userName = user.name;
            this.uploadForm.get(this.USER_NAME_FIELD_NAME).setValue(user.name);
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
            }
        );
    }

    public saveProfileChange() {
        let userName = this.uploadForm.get(this.USER_NAME_FIELD_NAME).value;
        let promises = new Array<Promise<any>>();
        this.errorMsg = null;
        if (userName && userName !== this.userName) {
            let promise = this.contractManagerService.setUserName(userName).then(() => {
                this.log.d("The user has set a new name");
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
                if(!this.errorMsg) {
                    this.dismiss();
                }
            });
        } else {
            this.errorMsg = this.noChangesError;
        }
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
