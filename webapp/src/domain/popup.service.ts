import { Injectable } from "@angular/core";
import { AlertController } from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class PopupService {

    public constructor(
        private translateSrv: TranslateService,
        public alertController: AlertController) {}


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
