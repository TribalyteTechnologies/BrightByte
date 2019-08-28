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
import { ContractManagerService } from "./contract-manager.service";

@Injectable()
export class UserDatabaseService {

    private database: Loki;
    private initObs: Observable<Loki.Collection>;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private achievementDbSrv: AchievementDatabaseService,
        private databaseSrv: CoreDatabaseService,
        private contractManagerService: ContractManagerService
    ) {
        this.log = loggerSrv.get("UserDatabaseService");
        this.initObs = this.init();
        if (BackendConfig.INITIALIZE_USER_DATABASE) {
            this.log.d("All the users details are going to be set. Data is coming from Smart Contracts");
            let obs = this.initializeUsersDatabase();
            obs.subscribe(result => {
                this.log.d("The result of the initialization is " + JSON.stringify(result));
            });
        }
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
            flatMap(user => this.achievementDbSrv.getAchievements(user.obtainedAchievements.toString().split(","))),
            map((achievements: Array<AchievementDto>) => new SuccessResponseDto(achievements)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE, error)))
        );
    }

    public createUser(userIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier });
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (!user) {
                    user = collection.insert(new UserDto(userIdentifier, 0, 0, []));
                    ret = this.databaseSrv.save(this.database, collection, user);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
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

    private initializeUsersDatabase(): Observable<String[]> {
        return this.initObs.pipe(
            flatMap(collection => forkJoin(
                of(collection),
                this.contractManagerService.getAllUserData()
            )),
            flatMap(([collection, users]) => {
                this.log.d("The current number of users is: " + users.length);
                let obs = users.map(user => {
                    this.log.d("The user is going to be saved: " + user.userHash);
                    let newUser = collection.findOne({ id: user.userHash });
                    if (newUser) {
                        newUser.reviewCount = user.finishedReviews;
                        newUser.commitCount = user.numberOfCommits;
                    } else {
                        newUser = collection.insert(new UserDto(user.userHash, user.finishedReviews, user.numberOfCommits, []));
                    }
                    return this.databaseSrv.save(this.database, collection, newUser);
                });
                return forkJoin(obs);
            })
        );
    }
}
