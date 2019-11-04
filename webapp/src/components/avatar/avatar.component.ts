import { Component, Input } from "@angular/core";
import { PopoverController } from "ionic-angular";
import { Profile } from "../../pages/profile/profile";
import { AppConfig } from "../../app.config";
import { UserAddressService } from "../../domain/user-address.service";
import { HttpClient } from "@angular/common/http";
import { ILogger, LoggerService } from "../../core/logger.service";

interface IResponse {
    data: string;
    status: string;
}

@Component({
    selector: "avatar",
    templateUrl: "avatar.component.html",
    styles: ["avatar.component.scss"]
})

export class Avatar {

    @Input()
    public userAddress: string;
    @Input()
    public isBig = false;

    @Input()
    public isPreview: boolean;

    @Input()
    public isClickable = false;

    @Input()
    private avatarUrl: string;

    private log: ILogger;

    private readonly PROFILE_IMAGE_URL = AppConfig.SERVER_BASE_URL + "/profile-image/";
    private readonly GET_PROFILE_IMAGE = this.PROFILE_IMAGE_URL + "getPath/";    
    private readonly IDENTICON_URL = "https://avatars.dicebear.com/v2/identicon/";
    private readonly IDENTICON_FORMAT = ".svg";

    constructor(
        loggerSrv: LoggerService,
        private popoverCtrl: PopoverController,
        private userAddressSrv: UserAddressService,
        private http: HttpClient
    ) {
        this.log = loggerSrv.get("AvatarComponent");
    }

    public ngOnInit() {
        if (!this.userAddress) {
            this.userAddress = this.userAddressSrv.get();
        }
        if (!this.avatarUrl) {
            this.updateAvatar();
        }
    }

    public ngOnChanges() {
        if (!this.isClickable && !this.isPreview) {
            this.updateAvatar();
        }
    }

    public openAddCommitDialog() {
        let popover = this.popoverCtrl.create(Profile, { }, { cssClass: "profile" });
        popover.present();
        popover.onDidDismiss(imageUrl => {
            if (imageUrl){
                this.avatarUrl = imageUrl;
            }
        });
    }

    private updateAvatar(){
        this.log.d("Updating the avatar of user: " + this.userAddress);
        this.http.get(this.GET_PROFILE_IMAGE + this.userAddress).subscribe(
        (response: IResponse) => {
            if (response && response.status === AppConfig.STATUS_OK){
                this.avatarUrl = this.PROFILE_IMAGE_URL + response.data + "?t=" + Math.random();
            }else{
                this.avatarUrl = this.IDENTICON_URL + this.userAddress + this.IDENTICON_FORMAT;
            }
            this.log.d("Avatar url is " + this.avatarUrl);
        }, 
        error => {
            this.log.e("ERROR: " + error.message);
            this.avatarUrl = this.IDENTICON_URL + this.userAddress + this.IDENTICON_FORMAT;
        });
    }
}

