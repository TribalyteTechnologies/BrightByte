import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { Observable, throwError, of, forkJoin } from "rxjs";
import { flatMap, tap, map, first, catchError, shareReplay } from "rxjs/operators";
import { UserDto, UserData } from "../dto/user.dto";
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

    public getCommitNumber(userIdentifier: string, teamUid: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            map((user: UserDto) => {
                let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid);
                return new SuccessResponseDto(teamUser.commitCount);
            }),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public getReviewNumber(userIdentifier: string, teamUid: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            map((user: UserDto) => {
                let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid);
                return new SuccessResponseDto(teamUser.reviewCount);
            }),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public hasAchievement(userIdentifier: string, teamUid: string, achievementIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            map((user: UserDto) => {
                let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid);
                return teamUser.obtainedAchievements;
            }),
            map((achievements: Array<string>) => new SuccessResponseDto(achievements.includes(achievementIdentifier))),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE, error)))
        );
    }

    public getObtainedAchievements(userIdentifier: string, teamUid: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            flatMap((user: UserDto) => this.achievementDbSrv.getAchievements(
                user.teamsData.find(userData => userData.teamUid === teamUid).obtainedAchievements)
            ),
            map((achievements: Array<AchievementDto>) => new SuccessResponseDto(achievements)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE, error)))
        );
    }

    public createUser(userIdentifier: string, teamUid: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret;
                if (user) {
                    let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid);
                    if(teamUser) {
                        ret = of(true);
                    } else {
                        user.teamsData.push(new UserData(teamUid));
                        ret = this.databaseSrv.save(this.database, collection, user);
                    }
                } else {
                    user = collection.insert(new UserDto(userIdentifier, new UserData(teamUid))) as UserDto;
                    ret = this.databaseSrv.save(this.database, collection, user);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto(created)),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public setCommitNumber(userIdentifier: string, teamUid: string, num: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (user) {
                    let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid);
                    if(teamUser) {
                        teamUser.commitCount = num;
                    } else {
                        user.teamsData.push(new UserData(teamUid, num));
                    }
                } else {
                    user = collection.insert(new UserDto(userIdentifier, new UserData(teamUid, num))) as UserDto;
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

    public setReviewNumber(userIdentifier: string, teamUid: string, num: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (user) {
                    let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid);
                    if(teamUser) {
                        teamUser.reviewCount = num;
                    } else {
                        user.teamsData.push(new UserData(teamUid, 0, num));
                    }
                } else {
                    user = collection.insert(new UserDto(userIdentifier, new UserData(teamUid, 0, num))) as UserDto;
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

    public initializeNewUser(
        userIdentifier: string, teamUid: string, numberOfCommits: number, numberOfReviews: number
    ): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                this.log.d("First Find the user with id " + userIdentifier);
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (!user) {
                    let userData = new UserData(teamUid, numberOfCommits, numberOfReviews);
                    user = collection.insert(new UserDto(userIdentifier, userData)) as UserDto;
                } else {
                    let userData = new UserData(teamUid, numberOfCommits, numberOfReviews);
                    user.teamsData.push(userData);
                }
                ret = this.databaseSrv.save(this.database, collection, user);
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public setObtainedAchievement(userIdentifier: string, teamUid: string, achievementIdentifiers: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let achievementIds = achievementIdentifiers.split(",");
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let userData: UserData;
                if (user) {
                    let teamUser = user.teamsData.find(userTeamData => userTeamData.teamUid === teamUid);
                    if(teamUser) {
                        teamUser.obtainedAchievements = teamUser.obtainedAchievements.concat(achievementIds);
                    } else {
                        userData = new UserData(teamUid, 0, 0, achievementIds);
                        user.teamsData.push(userData);
                    }
                } else {
                    userData = new UserData(teamUid, 0, 0, achievementIds);
                    user = collection.insert(new UserDto(userIdentifier, userData)) as UserDto;
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
