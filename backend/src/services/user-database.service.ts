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

    public getCommitNumber(userIdentifier: string, teamUid: number, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            map((user: UserDto) => {
                let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid && userData.version === version);
                return new SuccessResponseDto(teamUser.commitCount);
            }),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public getReviewNumber(userIdentifier: string, teamUid: number, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            map((user: UserDto) => {
                let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid && userData.version === version);
                return new SuccessResponseDto(teamUser.reviewCount);
            }),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public hasAchievement(
        userIdentifier: string, teamUid: number, achievementIdentifier: string, version: number
    ): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            map((user: UserDto) => {
                let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid && userData.version === version);
                return teamUser.obtainedAchievements;
            }),
            map((achievements: Array<string>) => new SuccessResponseDto(achievements.includes(achievementIdentifier))),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE, error)))
        );
    }

    public getObtainedAchievements(userIdentifier: string, teamUid: number, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier }) as UserDto),
            flatMap((user: UserDto) => {
                let achivements = user.teamsData.filter((userData: UserData) => 
                    userData.teamUid === teamUid && userData.version === version
                );
                this.log.d("The user obtained achivements are", achivements);
                return this.achievementDbSrv.getAchievements(achivements[0].obtainedAchievements);
            }),
            map((achievements: Array<AchievementDto>) => new SuccessResponseDto(achievements)),
            catchError(error => {
                this.log.e("Error getting achivements: ", error);
                return of(new FailureResponseDto(BackendConfig.STATUS_FAILURE, error));
            })
        );
    }

    public createUser(userIdentifier: string, teamUid: number, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret;
                if (user) {
                    let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid && userData.version === version);
                    if(teamUser) {
                        ret = of(true);
                    } else {
                        user.teamsData.push(new UserData(teamUid, version));
                        ret = this.databaseSrv.save(this.database, collection, user);
                    }
                } else {
                    user = collection.insert(new UserDto(userIdentifier, new UserData(teamUid, version))) as UserDto;
                    ret = this.databaseSrv.save(this.database, collection, user);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto(created)),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public setCommitNumber(userIdentifier: string, teamUid: number, num: number, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (user) {
                    let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid && userData.version === version);
                    if(teamUser) {
                        teamUser.commitCount = num;
                    } else {
                        user.teamsData.push(new UserData(teamUid, version, num));
                    }
                } else {
                    user = collection.insert(new UserDto(userIdentifier, new UserData(teamUid, version, num))) as UserDto;
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

    public setReviewNumber(userIdentifier: string, teamUid: number, num: number, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (user) {
                    let teamUser = user.teamsData.find(userData => userData.teamUid === teamUid && userData.version === version);
                    if(teamUser) {
                        teamUser.reviewCount = num;
                    } else {
                        user.teamsData.push(new UserData(teamUid, version, 0, num));
                    }
                } else {
                    user = collection.insert(new UserDto(userIdentifier, new UserData(teamUid, version, 0, num))) as UserDto;
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
        userIdentifier: string, teamUid: number, numberOfCommits: number, numberOfReviews: number, version: number
    ): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                this.log.d("First Find the user with id " + userIdentifier);
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (!user) {
                    let userData = new UserData(teamUid, version, numberOfCommits, numberOfReviews);
                    user = collection.insert(new UserDto(userIdentifier, userData)) as UserDto;
                } else {
                    let userData = new UserData(teamUid, version, numberOfCommits, numberOfReviews);
                    user.teamsData.push(userData);
                }
                ret = this.databaseSrv.save(this.database, collection, user);
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public setObtainedAchievement(
        userIdentifier: string, teamUid: number, achievementIdentifiers: string, version: number
    ): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let achievementIds = achievementIdentifiers.split(",");
                let user = collection.findOne({ id: userIdentifier }) as UserDto;
                let userData: UserData;
                if (user) {
                    let teamUser = user.teamsData.find(userTeamData => {
                        return userTeamData.teamUid === teamUid && userTeamData.version === version;
                    });
                    if(teamUser) {
                        teamUser.obtainedAchievements = teamUser.obtainedAchievements.concat(achievementIds);
                    } else {
                        userData = new UserData(teamUid, version, 0, 0, achievementIds);
                        user.teamsData.push(userData);
                    }
                } else {
                    userData = new UserData(teamUid, version, 0, 0, achievementIds);
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
