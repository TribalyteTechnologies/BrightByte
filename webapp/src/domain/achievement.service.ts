import { ILogger, LoggerService } from "../core/logger.service";
import { PopoverController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Achievement } from "../models/achievement.model";
import { AchievementPopOver } from "../pages/achievementpopover/achievementpopover";
import { AppConfig } from "../app.config";
import { Observable } from "rxjs";
import { ContractManagerService } from "../domain/contract-manager.service";
import { from } from "rxjs/observable/from";
import { flatMap, map } from "rxjs/operators";

interface IAchievementResponse {
    data: Array<any>;
    status: string;
}

@Injectable()
export class AchievementService {

    public readonly COMMIT_ID = 0;
    public readonly REVIEW_ID = 1;

    private readonly NUMBER_OF_ACHIEVEMENTS = 18;
    private readonly REQ_ROUTE = AppConfig.SERVER_BASE_URL + "/database/achievements/";
    private log: ILogger;
    private achievements = new Array<Achievement>();
    private currentVersion: string;

    constructor(
        loggerSrv: LoggerService,
        private popoverCtrl: PopoverController,
        private contractManagerService: ContractManagerService,
        private http: HttpClient
    ) {
        this.log = loggerSrv.get("AchievementService");
    }

    public getCurrentUnlockedAchievements(userHash: string, teamUid: number): Observable<Array<Achievement>> {
        this.log.d("Request to get unlocked achievements for user", userHash);

        let achievementsObservable = from(this.contractManagerService.getCurrentVersionFromBase()).pipe(
            flatMap((res: string) => {
                this.currentVersion = res;
                const url = this.REQ_ROUTE + userHash + "/" + teamUid + "/" + this.currentVersion;
                this.log.w("Get url for achivemetns is ", url);
                return this.http.get(url);
            }),
            map((response: IAchievementResponse) => {
                let currentAchievements = new Array<Achievement>();
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
            })
        );
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
