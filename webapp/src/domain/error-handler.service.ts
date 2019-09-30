import { ErrorHandler, Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { AlertController } from "ionic-angular";

@Injectable()
export class ErrorHandlerService implements ErrorHandler {
    
    private readonly MAX_ERROR_LENGTH = 150;
    private log: ILogger;

    constructor(loggerSrv: LoggerService, public alertCtrl: AlertController){ 
        this.log = loggerSrv.get("ErrorHandlerService");

    }
    
    public handleError(error: any): void {
        if(error){
            let errorText = error.toString().substring(0, this.MAX_ERROR_LENGTH).concat("...");
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

    public showUserAlert(text: string){
        const alert = this.alertCtrl.create({
            title: "An error has ocurred",
            subTitle: text,
            buttons: ["OK"]
          });
        alert.present();
    }
}
