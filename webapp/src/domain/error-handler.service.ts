import { ErrorHandler, Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { AlertController } from "ionic-angular";
@Injectable()
export class ErrorHandlerService implements ErrorHandler {
    private log: ILogger;
    constructor(loggerSrv: LoggerService, public alertCtrl: AlertController){ 
        this.log = loggerSrv.get("ErrorHandlerService");

    }
    
    public handleError(error: any): void {
        if(error){
            this.log.e("Uncatched error: ", error.toString());
            const alert = this.alertCtrl.create({
                title: "Upss, Something has happened",
                subTitle: error.toString(),
                buttons: ["OK"]
              });
            alert.present();
        } else {
            this.log.e("No error object to handle");
        }
    }    
}
