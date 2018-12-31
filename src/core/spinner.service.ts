import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "./logger.service";
import { LoadingController, Loading } from "ionic-angular";

@Injectable()
export class SpinnerService {

    public loader: Loading = null;
    private log: ILogger;

    constructor(public loggerSrv: LoggerService, private loadingCtrl: LoadingController){
        this.log = loggerSrv.get("SpinnerService");
        this.log.d("Spinner service created");
    }

    public showLoader(){
        if (!this.loader){
            this.loader = this.loadingCtrl.create();
            this.loader.present();
        }
    }

    public hideLoader(){
        if (this.loader){
            this.loader.dismiss();
            this.loader = null;
        }
    }


    
}
