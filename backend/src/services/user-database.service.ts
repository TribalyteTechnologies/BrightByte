import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { Observable, throwError, of, forkJoin } from "rxjs";
import { flatMap, tap, map, first, catchError } from "rxjs/operators";
import { UserDto } from "../dto/user.dto";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { CoreDatabaseService } from "./core-database.service";
import { AchievementDatabaseService } from "./achievement-database.service";
import { AchievementDto } from "../dto/achievement.dto";
import { ResponseDto } from "../dto/response/response.dto";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { FailureResponseDto } from "../dto/response/failure-response.dto";

@Injectable()
export class UserDatabaseService {

    private database: Loki;
    private initObs: Observable<Loki.Collection>;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private achievementDbSrv: AchievementDatabaseService,
        private databaseSrv: CoreDatabaseService
    ) {
        this.log = loggerSrv.get("UserDatabaseService");
        this.initObs = this.init();
        this.initObs.subscribe(() => this.log.d("The Event Data Base is ready"));
    }

    public getCommitNumber(userIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier })),
            map((user: UserDto) => new SuccessResponseDto(user.commitCount)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public getReviewNumber(userIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier })),
            map((user: UserDto) => new SuccessResponseDto(user.reviewCount)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public hasAchievement(userIdentifier: string, achievementIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier })),
            map(user => user.obtainedAchievements),
            map(achievements => new SuccessResponseDto(achievements.includes(achievementIdentifier))),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE, error)))
        );
    }

    public getObtainedAchievements(userIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier })),
            flatMap(user => this.achievementDbSrv.getAchievements(user.obtainedAchievements)),
            map((achievements: Array<AchievementDto>) => new SuccessResponseDto(achievements)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE, error)))
        );
    }

    public createUser(userIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier });
                let ret;
                if (user) {
                    ret = of(true);
                } else {
                    user = collection.insert(new UserDto(userIdentifier));
                    ret = this.databaseSrv.save(this.database, collection, user);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto(created)),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public setCommitNumber(userIdentifier: string, num: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier });
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (user) {
                    user.commitCount = num;
                } else {
                    user = collection.insert(new UserDto(userIdentifier, num, 0, []));
                }
                if (user) {
                    ret = this.databaseSrv.save(this.database, collection, user);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public setReviewNumber(userIdentifier: string, num: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier });
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (user) {
                    user.reviewCount = num;
                } else {
                    user = collection.insert(new UserDto(userIdentifier, num, 0, []));
                }
                if (user) {
                    ret = this.databaseSrv.save(this.database, collection, user);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public initializeNewUser(userIdentifier: string, numberOfCommits: number, numberOfReviews: number): any {
        return this.initObs.pipe(
            flatMap(collection => {
                this.log.d("First Find the user with id " + userIdentifier);
                let user = collection.findOne({ id: userIdentifier });
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (!user) {
                    user = collection.insert(new UserDto(userIdentifier, numberOfReviews, numberOfCommits, []));
                } else {
                    user.reviewCount = user.finishedReviews;
                    user.commitCount = user.numberOfCommits;
                    user.obtainedAchievements = new Array<String>();
                }
                ret = this.databaseSrv.save(this.database, collection, user);
                return ret;
            })
        );
    }

    public setObtainedAchievement(userIdentifier: string, achievementIdentifiers: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let achievementIds = achievementIdentifiers.split(",");
                let user = collection.findOne({
                    id: userIdentifier
                });
                if (user) {
                    let obtainedAchievements = user.obtainedAchievements;
                    achievementIds.forEach(id => obtainedAchievements.push(id));
                    user.obtainedAchievements = obtainedAchievements;
                } else {
                    user = collection.insert(new UserDto(userIdentifier, 0, 0, achievementIds));
                }
                if (user) {
                    ret = this.databaseSrv.save(this.database, collection, user);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    private init(): Observable<Loki.Collection> {
        return this.databaseSrv.initDatabase(BackendConfig.USER_DB_JSON).pipe(
            tap(database => this.database = database),
            flatMap(database => this.databaseSrv.initCollection(database, BackendConfig.USER_COLLECTION)),
            //first() is neccessary so that NestJS controllers can answer Http Requests.
            first(),
            tap(collection => this.initObs = of(collection))
        );
    }
}
