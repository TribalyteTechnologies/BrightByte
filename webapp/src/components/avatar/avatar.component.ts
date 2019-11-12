import { Component, Input } from "@angular/core";
import { PopoverController } from "ionic-angular";
import { Profile } from "../../pages/profile/profile";
import { ILogger, LoggerService } from "../../core/logger.service";

@Component({
    selector: "avatar",
    templateUrl: "avatar.component.html",
    styles: ["avatar.component.scss"]
})

export class AvatarComponent {

    @Input()
    public isBig = false;

    @Input()
    public isPreview: boolean;

    @Input()
    public isClickable = false;

    @Input()
    public avatarUrl: string;

    private log: ILogger;

    constructor(
        loggerSrv: LoggerService,
        private popoverCtrl: PopoverController
    ) {
        this.log = loggerSrv.get("AvatarComponent");
    }

    public openAddCommitDialog() {
        let popover = this.popoverCtrl.create(Profile, { }, { cssClass: "profile" });
        popover.present();
    }
}

