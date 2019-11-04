import { Component } from "@angular/core";
import { ViewController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../../app.config";
import { TranslateService } from "@ngx-translate/core";
import { UserAddressService } from "../../domain/user-address.service";
import { FormBuilder, FormGroup } from "@angular/forms";

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

    private readonly UPDATE_IMAGE_URL = "/profile-image/upload";

    private noImageError: string;
    private uploadError: string;

    private avatarUrl: string;
    private imageSelected = false;
    private errorMsg: string;

    private userAddress: string;

    private uploadForm: FormGroup;

    constructor(
        private http: HttpClient,
        private translateSrv: TranslateService,
        private userAddressSrv: UserAddressService,
        private viewCtrl: ViewController,
        private formBuilder: FormBuilder
    ) {
        this.userAddress = this.userAddressSrv.get();
    }

    public ngOnInit() {
        this.translateSrv.get("setProfile.noImageError").subscribe(translation => {
            this.noImageError = translation;
        });
        this.translateSrv.get("setProfile.uploadError").subscribe(translation => {
            this.uploadError = translation;
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

            this.http.post(AppConfig.SERVER_BASE_URL + this.UPDATE_IMAGE_URL + "?userHash=" + this.userAddress, formData)
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
