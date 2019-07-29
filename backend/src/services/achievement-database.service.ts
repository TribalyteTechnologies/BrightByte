import { Injectable } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { Observable, from } from "rxjs";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { AchievementDto } from "src/dto/achievement.dto";
import { CoreDatabaseService } from "./core-database.service";

@Injectable()
export class AchievementDatabaseService {

    private database: Loki;
    private collection: Loki.Collection;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private databaseSrv: CoreDatabaseService
    ) {
        this.log = loggerSrv.get("AchievementDatabaseService");

        this.init();
    }

    public getAchievements(ids: string): Observable<Array<AchievementDto>> {
        let achievementIdentifiers: number[] = ids.toString().split(",").map(id => parseInt(id));
        let achievements = new Array<AchievementDto>();
        for (let id of achievementIdentifiers) {
            let achievement = this.collection.findOne({ id: id });
            if (achievement) {
                achievements.push(
                    new AchievementDto(achievement.title, achievement.quantity, achievement.parameter, achievement.iconPath)
                );
            }
        }
        let ret: Observable<AchievementDto[]> = new Observable(observer => {
            observer.next(achievements);
            observer.complete();
        });
        return ret;
    }

    private init() {
        this.databaseSrv.initDatabase(BackendConfig.ACHIEVEMENT_DB_JSON).subscribe(
            database => {
                this.database = database;
                this.databaseSrv.initCollection(database, BackendConfig.ACHIEVEMENT_COLLECTION).subscribe(
                    collection => {
                        this.collection = collection;
                    }
                );
            }

        );
    }
}
