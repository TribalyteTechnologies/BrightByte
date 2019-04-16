import { Component } from "@angular/core";
import { ViewController, NavParams } from "ionic-angular";
import { Achievement } from "../../models/achievement.model";
import { LoggerService, ILogger } from "../../core/logger.service";



@Component({
    selector: "achievement-popover",
    templateUrl: "achievementpopover.html"
})
export class AchievementPopOver {

    public achievement: Achievement;
    private log: ILogger;

    constructor(public navParams: NavParams, private viewCtrl: ViewController, private loggerSrv: LoggerService){
        this.log = this.loggerSrv.get("CommitsPage");
        this.achievement = navParams.data.achievement;
    }

    public hidePopover(){
        this.viewCtrl.dismiss();
    }
    
}
