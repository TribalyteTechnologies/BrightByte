import { Component } from "@angular/core";
import { ViewController, NavParams } from "ionic-angular";
import { Achievement } from "../../models/achievement.model";
import { LoggerService, ILogger } from "../../core/logger.service";
import { AchievementService } from "../../core/achievement.service";


@Component({
    selector: "achievement-popover",
    templateUrl: "achievementpopover.html"
})
export class AchievementPopOver {

    public achievement: Achievement;
    
    private log: ILogger;
    private achievementSrv: AchievementService;

    constructor(
        navParams: NavParams, 
        loggerSrv: LoggerService,
        private viewCtrl: ViewController
    ){
        this.log = loggerSrv.get("AchievementPopOver");
        this.achievement = navParams.data.achievement;
        //NOTE: AchievementService passed as parameter to avoid circular dependency
        this.achievementSrv = navParams.data.achievementSrv;
    }

    public hidePopover(){
        this.achievementSrv.checkAchievementStack();
        this.viewCtrl.dismiss();
    }
    
}
