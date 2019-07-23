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

    public createAchievement(): Observable<any> {
        return new Observable(observer => {
            let achievement = this.collection.insert(
                new AchievementDto("First commit", 1, "Commit", "../../assets/imgs/trophys/achievement1.svg", 1)
            );
            this.collection.update(achievement);
            let achievement2 = this.collection.insert(
                new AchievementDto("Newbie", 1, "Commit", "../../assets/imgs/trophys/achievement2.svg", 2)
            );
            this.collection.update(achievement2);
            this.databaseService.saveDb(this.database).subscribe(
                null,
                error => observer.error(BackendConfig.STATUS_FAILURE),
                () => {
                    observer.next(BackendConfig.STATUS_SUCCESS);
                    observer.complete();
                }
            );
        });
    }

    public getAchievements(ids: string): Observable<AchievementDto[]> {
        return new Observable(observer => {
            let achievementIdentifiers = JSON.parse("[" + ids + "]");
            let achievements = [];
            //TODO: Change to foreach
            for (let id of achievementIdentifiers) {
                let achievement = this.collection.findOne({ id: id });
                if (achievement) {
                    achievements.push(
                        new AchievementDto(achievement.title, achievement.quantity, achievement.parameter, achievement.iconPath)
                    );
                }
            }
            if (achievements) {
                observer.next(achievements);
                observer.complete();
            } else {
                observer.error(BackendConfig.STATUS_FAILURE);
            }
        });
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
