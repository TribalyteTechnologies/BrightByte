import { ErrorHandler, Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { AlertController } from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class ErrorHandlerService implements ErrorHandler {
    
    private readonly MAX_ERROR_LENGTH = 150;
    private log: ILogger;

    constructor( 
        public alertCtrl: AlertController,
        private translateSrv: TranslateService,
        loggerSrv: LoggerService){ 
        this.log = loggerSrv.get("ErrorHandlerService");

    }
    
    public handleError(error: any): void {
        if(error){
            let errorText = error.toString().substring(0, this.MAX_ERROR_LENGTH).concat("...");
            this.log.e(errorText);
            const alert = this.alertCtrl.create({
                title: "Technical error",
                subTitle: errorText,
                buttons: ["OK"]
              });
            alert.present();
        } else {
            this.log.e("No error object to handle");
        }
    }

    public showUserAlert(text: string, title?: string){
        this.translateSrv.get("alerts.error").subscribe(msg => {
            title = title ? title : msg;
            const alert = this.alertCtrl.create({
                title: title,
                subTitle: text,
                buttons: ["OK"]
            });
            alert.present();
        });
    }
}
