import { Injectable, HttpService } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { Observable } from "rxjs";
import { UserDto } from "../dto/user.dto";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { AchievementDto } from "src/dto/achievement.dto";
import { CoreDatabaseService } from "./core-database.service";

@Injectable()
export class UserDatabaseService {

    private database: Loki;
    private collection: Loki.Collection;
    private log: ILogger;
    private databaseService: CoreDatabaseService;

    public constructor(
        loggerSrv: LoggerService,
        private httpService: HttpService
    ) {
        this.log = loggerSrv.get("UserDatabaseService");
        this.databaseService = new CoreDatabaseService(loggerSrv);
        this.init();
    }

    public getCommitNumber(userIdentifier: string): Observable<number> {
        let ret: Observable<number> = new Observable(observer => observer.error(BackendConfig.STATUS_FAILURE));
        let user = this.collection.findOne({ id: userIdentifier });
        if (user) {
            ret = new Observable(observer => {
                observer.next(user.commitCount);
                observer.complete();
            });
        }
        return ret;
    }

    public getReviewNumber(userIdentifier: string): Observable<number> {
        let ret: Observable<number> = new Observable(observer => observer.error(BackendConfig.STATUS_FAILURE));
        let user = this.collection.findOne({ id: userIdentifier });
        if (user) {
            ret = new Observable(observer => {
                observer.next(user.reviewCount);
                observer.complete();
            });
        }
        return ret;
    }

    public hasAchievement(userIdentifier: string, achievementIdentifier: string): Observable<boolean> {
        let ret: Observable<boolean> = new Observable(observer => observer.error(BackendConfig.STATUS_FAILURE));
        let user = this.collection.findOne({ id: userIdentifier });
        if (user) {
            let achievements = user.obtainedAchievements;
            ret = new Observable(observer => {
                observer.next(achievements.includes(parseInt(achievementIdentifier)));
                observer.complete();
            });
        }
        return ret;
    }

    public getObtainedAchievements(userIdentifier: string): Observable<AchievementDto[]> {
        return new Observable(observer => {
            let user = this.collection.findOne({ id: userIdentifier });
            if (user) {
                let achievements: AchievementDto[];
                this.httpService.get("http://localhost:" + BackendConfig.BRIGHTBYTE_DB_PORT + "/achievements/" + user.obtainedAchievements)
                    .subscribe(
                        axiosResponse => {
                            achievements = axiosResponse.data;
                            observer.next(achievements);
                            observer.complete();
                        },
                        error => {
                            observer.error(BackendConfig.STATUS_FAILURE);
                        }
                    );
            } else {
                observer.error(BackendConfig.STATUS_FAILURE);
            }
        });
    }
    
    public createUser(userIdentifier: string): Observable<string> {
        let ret: Observable<string> = new Observable(observer => observer.error(BackendConfig.STATUS_FAILURE));
        let user = this.collection.findOne({ id: userIdentifier });
        if (!user) {
            user = this.collection.insert(new UserDto(userIdentifier, 0, 0, []));
            ret = this.databaseService.save(this.database, this.collection, user);
        }
        return ret;
    }

    public setCommitNumber(userIdentifier: string, num: number): Observable<string>{
        let ret: Observable<string> = new Observable(observer => observer.error(BackendConfig.STATUS_FAILURE));
        let user = this.collection.findOne({ id: userIdentifier });
        if (user) {
            user.commitCount = num;
        } else {
            user = this.collection.insert(new UserDto(userIdentifier, num, 0, []));
        }
        if (user) {
            ret = this.databaseService.save(this.database, this.collection, user);
        }
        return ret;
    }

    public setReviewNumber(userIdentifier: string, num: number): Observable<string> {
        let ret: Observable<string> = new Observable(observer => observer.error(BackendConfig.STATUS_FAILURE));
        let user = this.collection.findOne({ id: userIdentifier });
        if (user) {
            user.reviewCount = num;
        } else {
            user = this.collection.insert(new UserDto(userIdentifier, num, 0, []));
        }
        if (user) {
            ret = this.databaseService.save(this.database, this.collection, user);
        }
        return ret;
    }

    public setObtainedAchievement(userIdentifier: string, achievementIdentifiers: string): Observable<string> {
        let ret: Observable<string> = new Observable(observer => observer.error(BackendConfig.STATUS_FAILURE));
        let achievementIds: number[] = Array.from(JSON.parse("[" + achievementIdentifiers + "]"));
        let user = this.collection.findOne({
            id: userIdentifier
        });
        if (user) {
            let obtainedAchievements: number[] = Array.from(JSON.parse("[" + user.obtainedAchievements + "]"));
            for (let id of achievementIds) {
                obtainedAchievements.push(id);
            }
            user.obtainedAchievements = obtainedAchievements;
        } else {
            user = this.collection.insert(new UserDto(userIdentifier, 0, 0, achievementIds));
        }
        if (user) {
            ret = this.databaseService.save(this.database, this.collection, user);
        }
        return ret;
    }

    private init() {
        this.databaseService.initDatabase(BackendConfig.USER_DB_JSON).subscribe(
            database => {
                this.database = database;
                this.databaseService.initCollection(database, BackendConfig.USER_COLLECTION).subscribe(
                    collection => {
                        this.collection = collection;
                    }
                );
            }

        );
    }
}
