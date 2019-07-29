import { Injectable } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { Observable, throwError, from } from "rxjs";
import { UserDto } from "../dto/user.dto";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { AchievementDto } from "src/dto/achievement.dto";
import { CoreDatabaseService } from "./core-database.service";
import { AchievementDatabaseService } from "./achievement-database.service";

@Injectable()
export class UserDatabaseService {

    private database: Loki;
    private collection: Loki.Collection;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private achievementDbSrv: AchievementDatabaseService,
        private databaseSrv: CoreDatabaseService
    ) {
        this.log = loggerSrv.get("UserDatabaseService");
        this.init();
    }

    public getCommitNumber(userIdentifier: string): Observable<number> {
        let ret: Observable<number> = throwError(BackendConfig.STATUS_FAILURE);
        let user = this.collection.findOne({ id: userIdentifier });
        if (user) {
            ret = from(user.commitCount);
        }
        return ret;
    }

    public getReviewNumber(userIdentifier: string): Observable<number> {
        let ret: Observable<number> = throwError(BackendConfig.STATUS_FAILURE);
        let user = this.collection.findOne({ id: userIdentifier });
        if (user) {
            ret = from(user.reviewCount);
        }
        return ret;
    }

    public hasAchievement(userIdentifier: string, achievementIdentifier: string): Observable<boolean> {
        let ret: Observable<boolean> = new Observable(observer => {
            observer.next(false);
            observer.complete();
        });
        let user = this.collection.findOne({ id: userIdentifier });
        if (user) {
            let achievements = user.obtainedAchievements;
            ret = from(achievements.includes(parseInt(achievementIdentifier)));
        }
        return ret;
    }

    public getObtainedAchievements(userIdentifier: string): Observable<number | Array<AchievementDto>> {
        return new Observable(observer => {
            let user = this.collection.findOne({ id: userIdentifier });
            if (user) {
                let achievements: AchievementDto[];
                this.achievementDbSrv.getAchievements(user.obtainedAchievements).subscribe(
                    response => {
                        achievements = response;
                        observer.next(achievements);
                        observer.complete();
                    },
                    error => {
                        observer.error();
                    }
                );
            } else {
                observer.next(BackendConfig.STATUS_NOT_FOUND);
                observer.complete();
            }
        });
    }

    public createUser(userIdentifier: string): Observable<string> {
        let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
        let user = this.collection.findOne({ id: userIdentifier });
        if (!user) {
            user = this.collection.insert(new UserDto(userIdentifier, 0, 0, []));
            ret = this.databaseSrv.save(this.database, this.collection, user);
        }
        return ret;
    }

    public setCommitNumber(userIdentifier: string, num: number): Observable<string> {
        let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
        let user = this.collection.findOne({ id: userIdentifier });
        if (user) {
            user.commitCount = num;
        } else {
            user = this.collection.insert(new UserDto(userIdentifier, num, 0, []));
        }
        if (user) {
            ret = this.databaseSrv.save(this.database, this.collection, user);
        }
        return ret;
    }

    public setReviewNumber(userIdentifier: string, num: number): Observable<string> {
        let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
        let user = this.collection.findOne({ id: userIdentifier });
        if (user) {
            user.reviewCount = num;
        } else {
            user = this.collection.insert(new UserDto(userIdentifier, num, 0, []));
        }
        if (user) {
            ret = this.databaseSrv.save(this.database, this.collection, user);
        }
        return ret;
    }

    public setObtainedAchievement(userIdentifier: string, achievementIdentifiers: string): Observable<string> {
        let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
        let achievementIds: number[] = Array.from(achievementIdentifiers.split(",")).map(id => parseInt(id));
        let user = this.collection.findOne({
            id: userIdentifier
        });
        if (user) {
            let obtainedAchievements: number[] = Array.from(user.obtainedAchievements.split(","));
            for (let id of achievementIds) {
                obtainedAchievements.push(id);
            }
            user.obtainedAchievements = obtainedAchievements;
        } else {
            user = this.collection.insert(new UserDto(userIdentifier, 0, 0, achievementIds));
        }
        if (user) {
            ret = this.databaseSrv.save(this.database, this.collection, user);
        }
        return ret;
    }

    private init() {
        this.databaseSrv.initDatabase(BackendConfig.USER_DB_JSON).subscribe(
            database => {
                this.database = database;
                this.databaseSrv.initCollection(database, BackendConfig.USER_COLLECTION).subscribe(
                    collection => {
                        this.collection = collection;
                    }
                );
            }

        );
    }
}
