import { ErrorHandler, Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { AlertController } from "ionic-angular";
@Injectable()
export class ErrorHandlerService implements ErrorHandler {
    private log: ILogger;
    constructor(loggerSrv: LoggerService, public alertCtrl: AlertController){ 
        this.log = loggerSrv.get("LoginPage");

    }
    
    public handleError(error: any): void {
        if(error){
            this.log.d("Uncatched error: ", error);
            const alert = this.alertCtrl.create({
                title: "Upss, Something has happened",
                subTitle: error,
                buttons: ["OK"]
              });
            alert.present();
        }
    }    
}
