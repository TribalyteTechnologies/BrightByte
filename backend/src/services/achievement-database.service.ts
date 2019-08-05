import { Injectable } from "@nestjs/common";
import { Observable, of } from "rxjs";
import { ILogger, LoggerService } from "../logger/logger.service";
import { AchievementDto } from "src/dto/achievement.dto";
import { AchievementConfig } from "src/achievement.config";

@Injectable()
export class AchievementDatabaseService {

    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("AchievementDatabaseService");
    }

    public getAchievements(ids: string): Observable<Array<AchievementDto>> {
        let achievementIdentifiers: number[] = ids.toString().split(",").map(id => parseInt(id));
        let achievements = new Array<AchievementDto>();
        achievementIdentifiers.forEach(id => achievements.push(AchievementConfig.achievements.get(id)));
        return of(achievements);
    }
}
