import { Injectable } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { Observable } from "rxjs";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { AchievementDto } from "src/dto/achievement.dto";

@Injectable()
export class AchievementDatabaseService {

    private database: Loki;
    private collection: Loki.Collection;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("AchievementDatabaseService");
        this.initDatabase();
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
            this.saveDb().subscribe(
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

    private initDatabase() {
        this.database = new Loki(BackendConfig.ACHIEVEMENT_DB_JSON);
        this.database.loadDatabase({}, (err) => {
            if (err) {
                this.log.d(BackendConfig.DATABASE_LOADING_ERROR);
            } else {
                this.collection = this.database.getCollection(BackendConfig.ACHIEVEMENT_COLLECTION);
                if (!this.collection) {
                    this.log.d(BackendConfig.COLLECTION_NOT_FOUND);
                    this.collection = this.database.addCollection(BackendConfig.ACHIEVEMENT_COLLECTION);
                    this.saveDb().subscribe(
                        null,
                        error => this.log.d(BackendConfig.COLLECTION_NOT_CREATED),
                        () => this.log.d(BackendConfig.COLLECTION_CREATED)
                    );
                } else {
                    this.log.d(BackendConfig.COLLECTION_LOADED);
                }
            }
        });
    }

    private saveDb(): Observable<any> {
        return new Observable<any>(observer => {
            this.database.saveDatabase(function (err) {
                err ? observer.error() : observer.complete();
            });
        });
    }
}
