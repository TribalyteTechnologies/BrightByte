import { ILogger, LoggerService } from "../core/logger.service";
import { PopoverController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Achievement } from "../models/achievement.model";
import { AchievementPopOver } from "../pages/achievementpopover/achievementpopover";
import { AppConfig } from "../app.config";
import { Observable } from "rxjs";

interface IAchievementResponse {
    data: Array<any>;
    status: string;
}

@Injectable()
export class AchievementService {

    public readonly COMMIT_ID = 0;
    public readonly REVIEW_ID = 1;

    private readonly NUMBER_OF_ACHIEVEMENTS = 18;
    private readonly REQ_ROUTE = "/database/achievements/";
    private log: ILogger;
    private achievements = new Array<Achievement>();

    constructor(
        loggerSrv: LoggerService,
        private popoverCtrl: PopoverController,
        private http: HttpClient
    ) {
        this.log = loggerSrv.get("AchievementService");
    }

    public getCurrentUnlockedAchievements(userHash: string): Observable<Array<Achievement>> {
        let achievementsObservable: Observable<Array<Achievement>>;
        let currentAchievements = new Array<Achievement>();

        achievementsObservable = this.http.get(AppConfig.SERVER_BASE_URL + this.REQ_ROUTE + userHash)
        .map((response: IAchievementResponse) => {
                if (response && response.status === AppConfig.STATUS_OK) {
                    for (let achievement of response.data) {
                        if (achievement) {
                            currentAchievements.push(
                            new Achievement(
                                false,
                                achievement.title,
                                achievement.values[0],
                                achievement.parameter,
                                achievement.iconPath,
                                achievement.processorType)
                            );
                        }
                    }
                }

                for (let i = currentAchievements.length; i < this.NUMBER_OF_ACHIEVEMENTS; i++) {
                    currentAchievements.push(new Achievement());
                }
                return currentAchievements;
            });

        return achievementsObservable;
    }

    public addNewAchievement(newAchievement: Achievement) {
        this.achievements.push(newAchievement);
    }

    public checkAchievementStack() {
        if (this.achievements.length > 0) {
            let newAchievement = this.achievements.pop();
            this.openAchievementDialog(newAchievement);
        }
    }

    public openAchievementDialog(achievement: Achievement) {
        let popover = this.popoverCtrl.create(
            AchievementPopOver,
            { achievement, achievementSrv: this },
            { cssClass: "achievement-popover" }
        );
        popover.present();
    }
}
