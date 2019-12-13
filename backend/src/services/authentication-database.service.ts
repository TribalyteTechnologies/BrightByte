import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { Observable, throwError, of  } from "rxjs";
import { flatMap, tap, map, first, catchError, share } from "rxjs/operators";
import { UserAuthenticationDto } from "../dto/user-authentication.dto";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { CoreDatabaseService } from "./core-database.service";
import { ResponseDto } from "../dto/response/response.dto";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { FailureResponseDto } from "../dto/response/failure-response.dto";

@Injectable()
export class AuthenticationDatabaseService {

    private database: Loki;
    private initObs: Observable<Loki.Collection>;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private databaseSrv: CoreDatabaseService
    ) {
        this.log = loggerSrv.get("AuthenticationDatabaseService");
        this.init();
    }

    public getUserToken(userIdentifier: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: userIdentifier })),
            map((user: UserAuthenticationDto) => new SuccessResponseDto(user.token)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public setUserToken(userIdentifier: string, token: string): Observable<ResponseDto> {
        this.log.d("Saving token for the user " + userIdentifier);
        return this.initObs.pipe(
            flatMap(collection => {
                let user = collection.findOne({ id: userIdentifier });
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                if (user) {
                    user.token = token;
                    ret = this.databaseSrv.save(this.database, collection, user);
                } else {
                    user = collection.insert(new UserAuthenticationDto(userIdentifier, token));
                    ret = this.databaseSrv.save(this.database, collection, user);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    private init() {
        this.initObs = this.databaseSrv.initDatabase(BackendConfig.AUTHENTICATION_DB_JSON).pipe(
            tap(database => this.database = database),
            flatMap(database => this.databaseSrv.initCollection(database, BackendConfig.AUTHENTICATION_COLLECTION)),
            //first() is neccessary so that NestJS controllers can answer Http Requests.
            first(),
            tap(collection => this.initObs = of(collection)),
            share()
        );
    }
}
