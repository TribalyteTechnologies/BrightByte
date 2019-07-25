import { Injectable } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { Observable } from "rxjs";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { AchievementDto } from "src/dto/achievement.dto";
import { CoreDatabaseService } from "./core-database.service";

@Injectable()
export class AchievementDatabaseService {

    private database: Loki;
    private collection: Loki.Collection;
    private log: ILogger;
    private databaseService: CoreDatabaseService;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("AchievementDatabaseService");
        this.databaseService = new CoreDatabaseService(loggerSrv);
        this.init();
    }

    public getAchievements(ids: string): Observable<AchievementDto[]> {
        let ret: Observable<AchievementDto[]> = new Observable(observer => observer.error(BackendConfig.STATUS_FAILURE));
        let achievementIdentifiers = JSON.parse("[" + ids + "]");
        let achievements = [];
        for (let id of achievementIdentifiers) {
            let achievement = this.collection.findOne({ id: id });
            if (achievement) {
                achievements.push(
                    new AchievementDto(achievement.title, achievement.quantity, achievement.parameter, achievement.iconPath)
                );
            }
        }
        if (achievements) {
            ret = new Observable(observer => {
                observer.next(achievements);
                observer.complete();
            });
        } 
        return ret;
    }

    private init() {
        this.databaseService.initDatabase(BackendConfig.ACHIEVEMENT_DB_JSON).subscribe(
            database => {
                this.database = database;
                this.databaseService.initCollection(database, BackendConfig.ACHIEVEMENT_COLLECTION).subscribe(
                    collection => {
                        this.collection = collection;
                    }
                );
            }

        );
    }
}
