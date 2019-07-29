import { ILogger, LoggerService } from "./logger.service";
import { PopoverController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Achievement } from "../models/achievement.model";
import { AchievementPopOver } from "../pages/achievementpopover/achievementpopover";
import { AppConfig } from "../app.config";
import { Observable } from "rxjs";

@Injectable()
export class AchievementService {

    public readonly COMMIT_ID = 0;
    public readonly REVIEW_ID = 1;

    private readonly NOT_FOUND = 404;

    private readonly ACHIEVEMENTS = [new Achievement(false, "First commit", 1, "Commit", "../../assets/imgs/trophys/achievement1.svg"),
    new Achievement(false, "Newbie", 10, "Commits", "../../assets/imgs/trophys/achievement2.svg"),
    new Achievement(false, "Beginner", 50, "Commits", "../../assets/imgs/trophys/achievement3.svg"),
    new Achievement(false, "Intermediate", 100, "Commits", "../../assets/imgs/trophys/achievement4.svg"),
    new Achievement(false, "Pro", 250, "Commits", "../../assets/imgs/trophys/achievement5.svg"),
    new Achievement(false, "Master", 1000, "Commits", "../../assets/imgs/trophys/achievement6.svg"),
    new Achievement(false, "First review", 1, "Reviews", "../../assets/imgs/trophys/achievement1.svg"),
    new Achievement(false, "Newbie", 10, "Reviews", "../../assets/imgs/trophys/achievement2.svg"),
    new Achievement(false, "Beginner", 50, "Reviews", "../../assets/imgs/trophys/achievement3.svg"),
    new Achievement(false, "Intermediate", 100, "Reviews", "../../assets/imgs/trophys/achievement4.svg"),
    new Achievement(false, "Pro", 250, "Reviews", "../../assets/imgs/trophys/achievement5.svg"),
    new Achievement(false, "Master", 1000, "Reviews", "../../assets/imgs/trophys/achievement6.svg"),
    new Achievement(false, "First peak", 5, "EIndex", "../../assets/imgs/trophys/achievement1.svg"),
    new Achievement(false, "Newbie", 25, "EIndex", "../../assets/imgs/trophys/achievement2.svg"),
    new Achievement(false, "Beginner", 100, "EIndex", "../../assets/imgs/trophys/achievement3.svg"),
    new Achievement(false, "Intermediate", 250, "EIndex", "../../assets/imgs/trophys/achievement4.svg"),
    new Achievement(false, "Pro", 500, "EIndex", "../../assets/imgs/trophys/achievement5.svg"),
    new Achievement(false, "Master", 1000, "EIndex", "../../assets/imgs/trophys/achievement6.svg")];
    private readonly RANGES = [[1, 10, 50, 100, 250, 1000], [1, 10, 50, 100, 250, 1000], [5, 25, 100, 250, 500, 1000]];
    private readonly INIT_INDEXES = [0, 6, 12];
    private log: ILogger;

    constructor(
        private loggerSrv: LoggerService,
        private popoverCtrl: PopoverController,
        private http: HttpClient
    ) {
        this.log = this.loggerSrv.get("AchievementService");
    }

    public getCurrentUnlockedAchievements(userHash: string): Observable<Array<Achievement>> {
        let currentAchievements = new Array<Achievement>();

        return this.http.get(AppConfig.BACKEND_NETWORK + "/database/achievements/" + userHash).map((response: any) => {
            if (response !== this.NOT_FOUND && response !== []) {
                for (let i = 0; i < response.length; i++) {
                    currentAchievements.push(
                        new Achievement(false, response[i].title, response[i].quantity, response[i].parameter, response[i].iconPath));
                }
            }

            for (let i = currentAchievements.length; i < this.ACHIEVEMENTS.length; i++) {
                currentAchievements.push(new Achievement());
            }
            return currentAchievements;
        });
    }

    public checkForNewAchievement(paramVal: number, idParam: number) {
        let achievement = null;

        if (idParam === 0 || idParam === 1) {
            for (let i = this.RANGES[idParam].length; i >= 0; i--) {
                if (paramVal === this.RANGES[idParam][i]) {
                    achievement = this.ACHIEVEMENTS[this.INIT_INDEXES[idParam] + i];
                }
            }
        }

        if (achievement) {
            this.openAchievementDialog(achievement);
        }
    }

    private openAchievementDialog(achievement: Achievement) {
        let popover = this.popoverCtrl.create(AchievementPopOver, { achievement }, { cssClass: "achievement-popover" });
        popover.present();
    }



}
