import { Component } from "@angular/core";
import { ViewController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../../app.config";
import { TranslateService } from "@ngx-translate/core";
import { UserAddressService } from "../../domain/user-address.service";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ILogger, LoggerService } from "../../core/logger.service";
import { map, catchError, flatMap} from "rxjs/operators";

interface IResponse {
    data: string;
    status: string;
    descrption: string;
}

@Component({
    selector: "profile",
    templateUrl: "profile.html"
})

export class Profile {

    private readonly UPDATE_IMAGE_URL = AppConfig.SERVER_BASE_URL + "/profile-image/upload";

    private noImageError: string;
    private uploadError: string;
    private defaultError: string;
    private avatarUrl: string;
    private imageSelected = false;
    private errorMsg: string;
    private userAddress: string;
    private uploadForm: FormGroup;
    private log: ILogger;

    constructor(
        loggerSrv: LoggerService,
        private http: HttpClient,
        private translateSrv: TranslateService,
        private userAddressSrv: UserAddressService,
        private viewCtrl: ViewController,
        private formBuilder: FormBuilder
    ) {
        this.userAddress = this.userAddressSrv.get();
        this.log = loggerSrv.get("ProfilePage");
    }

    public ngOnInit() {
        this.translateSrv.get("setProfile.noImageError").subscribe(translation => {
            this.noImageError = translation;
        });
        this.translateSrv.get("setProfile.uploadError").subscribe(translation => {
            this.uploadError = translation;
        });
        this.translateSrv.get("setProfile.defaultError").subscribe(translation => {
            this.defaultError = translation;
        });
        this.uploadForm = this.formBuilder.group({
            image: [""]
        });
    }

    public openFile(event: Event) {
        let target = <HTMLInputElement>event.target;
        let uploadedFiles = <FileList>target.files;
        let input = uploadedFiles[0];
        this.uploadForm.get("image").setValue(input);
        this.getBase64(input).then((data: string) => {
            this.avatarUrl = data;
            this.imageSelected = true;
            this.errorMsg = null;
        });
    }

    public saveProfileImage() {
        if (this.imageSelected) {
            let formData = new FormData();
            formData.append("image", this.uploadForm.get("image").value);

            this.http.post(this.UPDATE_IMAGE_URL + "?userHash=" + this.userAddress, formData)
                .subscribe(
                (response: IResponse) => {
                    if (response.status === AppConfig.STATUS_OK) {
                        this.dismiss();
                    }
                },
                (error) => {
                    this.errorMsg = this.uploadError;
                });

        } else {
            this.errorMsg = this.noImageError;
        }
    }

    public deleteAvatar() {
        this.log.d("Request to delete profile avatar");
        this.http.get(AppConfig.GET_PROFILE_IMAGE + this.userAddress).pipe(
        flatMap((response: IResponse) => {
            let ret;
            if (response && response.status === AppConfig.STATUS_OK) {
                this.log.d("Enable to delete the user avatar");
                ret = this.http.delete(AppConfig.PROFILE_IMAGE_URL + this.userAddress);
            } else {
                this.log.d("User alredy has his default avatar");
            }
            return ret;
        }),
        map((response: IResponse) => {
            if (response && response.status === AppConfig.STATUS_OK) {
                this.avatarUrl = AppConfig.IDENTICON_URL + this.userAddress + AppConfig.IDENTICON_FORMAT;
                this.log.d("Changed the avatar to default one " + this.avatarUrl);
                this.dismiss();
            }
        }),
        catchError(error => this.errorMsg = this.defaultError)
        ).subscribe();
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
        this.viewCtrl.dismiss(this.avatarUrl);
    }
}
