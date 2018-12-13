import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "./logger.service";
import { LoadingController } from "ionic-angular";

@Injectable()
export class SpinnerService {

    public loader: any = null;
    private log: ILogger;

    constructor(public loggerSrv: LoggerService, private loadingCtrl: LoadingController){
        this.log = loggerSrv.get("SpinnerService");
        this.log.d("Spinner service created");
    }

    public showLoader(){
        this.showLoadingHandler();
    }

    public hideLoader(){
        this.hideLoadingHandler();
    }

    private showLoadingHandler(){
        if (this.loader === null){
            this.loader = this.loadingCtrl.create();
            this.loader.present();
        }
    }

    private hideLoadingHandler(){
        if (this.loader != null){
            this.loader.dismiss();
            this.loader = null;
        }
    }

    
}
