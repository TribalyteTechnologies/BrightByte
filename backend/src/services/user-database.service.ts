import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { Observable, throwError, of, forkJoin } from "rxjs";
import { flatMap, tap, map, first, catchError, shareReplay } from "rxjs/operators";
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
        this.init();
    }

    public getCommitNumber(userIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            map((user: UserDto) => new SuccessResponseDto(user.commitCount)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public getReviewNumber(userIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            map((user: UserDto) => new SuccessResponseDto(user.reviewCount)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public hasAchievement(userIdentifier: string, achievementIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            map((user: UserDto) => user.obtainedAchievements),
            map((achievements: Array<string>) => new SuccessResponseDto(achievements.includes(achievementIdentifier))),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE, error)))
        );
    }

    public getObtainedAchievements(userIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            flatMap((user: UserDto) => this.achievementDbSrv.getAchievements(user.obtainedAchievements)),
            map((achievements: Array<AchievementDto>) => new SuccessResponseDto(achievements)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE, error)))
        );
    }

    public createUser(userIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret;
                if (user) {
                    ret = of(true);
                } else {
                    user = collection.insert(new UserDto(userIdentifier)) as UserDto;
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
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (user) {
                    user.commitCount = num;
                } else {
                    user = collection.insert(new UserDto(userIdentifier, num, 0, new Array<string>())) as UserDto;
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
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (user) {
                    user.reviewCount = num;
                } else {
                    user = collection.insert(new UserDto(userIdentifier, num, 0, new Array<string>())) as UserDto;
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

    public initializeNewUser(userIdentifier: string, numberOfCommits: number, numberOfReviews: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                this.log.d("First Find the user with id " + userIdentifier);
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (!user) {
                    user = collection.insert(new UserDto(userIdentifier, numberOfReviews, numberOfCommits, new Array<string>())) as UserDto;
                } else {
                    user.reviewCount = numberOfReviews;
                    user.commitCount = numberOfCommits;
                    user.obtainedAchievements = user.obtainedAchievements;
                }
                ret = this.databaseSrv.save(this.database, collection, user);
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public setObtainedAchievement(userIdentifier: string, achievementIdentifiers: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let achievementIds = achievementIdentifiers.split(",");
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                if (user) {
                    let obtainedAchievements = user.obtainedAchievements;
                    achievementIds.forEach(id => obtainedAchievements.push(id));
                    user.obtainedAchievements = obtainedAchievements;
                } else {
                    user = collection.insert(new UserDto(userIdentifier, 0, 0, achievementIds)) as UserDto;
                }
                if (user) {
                    ret = this.databaseSrv.save(this.database, collection, user);
                }
                this.log.d("New achivement saved for user", userIdentifier);
                return ret;
            }),
            map(created => new SuccessResponseDto("New achivement saved for user " + userIdentifier)),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    private init() {
        this.initObs = this.databaseSrv.initDatabase(BackendConfig.USER_DB_JSON).pipe(
            tap(database => this.database = database),
            flatMap(database => this.databaseSrv.initCollection(database, BackendConfig.USER_COLLECTION)),
            //first() is neccessary so that NestJS controllers can answer Http Requests.
            first(),
            shareReplay(BackendConfig.BUFFER_SIZE)
        );
    }
}
