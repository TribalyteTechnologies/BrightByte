import { Injectable } from "@angular/core";
import { AlertController } from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";
import { SharePopOver } from "../pages/sharepopover/sharepopover";
import { Profile } from "../pages/profile/profile";
import { AfterLoginSlidePopover } from "../components/after-login-tutorial-slide/after-login-tutorial-slide.component";
import { AddCommitPopover } from "../pages/addcommit/addcommit";
import { PopoverController } from "ionic-angular";

@Injectable()
export class PopupService {

    public constructor(
        private translateSrv: TranslateService,
        private popoverCtrl: PopoverController,
        private alertController: AlertController) {}


    public openUrlNewTab(url: string): Promise<Window> {
        let tab = window.open(url, "_blank");
        let promise;
        if (!tab){
            promise = this.translateSrv.get(["alerts.warning", "alerts.allowPopUpWindow"]).toPromise()
            .then(translations => {
                return this.showAlert(translations["alerts.warning"], translations["alerts.allowPopUpWindow"]);
            })
            .then(() => tab);
        } else {
            promise = Promise.resolve(tab);
        }
        return promise;
    }

    public showSharingDialog() {
        let popover = this.popoverCtrl.create(SharePopOver, { }, { cssClass: "sharepopover" });
        popover.present();
    }

    public openSetProfileDialog() {
        let popover = this.popoverCtrl.create(Profile, { }, { cssClass: "profile" });
        popover.present();
    }

    public openAfterLoginTutorialDialog() {
        let popover = this.popoverCtrl.create(AfterLoginSlidePopover, {}, { cssClass: "tutorial-slide" });
        popover.present();
    }

    public openAddCommitDialog() {
        let popover = this.popoverCtrl.create(AddCommitPopover, {}, { cssClass: "add-commit-popover" });
        popover.present();
    }

    public async showAlert(header: string, messageText: string): Promise<any> {
        const alert = await this.alertController.create({
            title: header,
            message: messageText,
            buttons: [
                {
                    text: await this.translateSrv.get("general.ok").toPromise()
                }
            ]
        });

        return alert.present();
    }
}
