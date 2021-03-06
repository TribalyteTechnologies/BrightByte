import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { Observable, throwError, of } from "rxjs";
import { flatMap, tap, map, first, catchError, shareReplay, share } from "rxjs/operators";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { CoreDatabaseService } from "./core-database.service";
import { AchievementEventDto } from "../dto/events/achievement-event.dto";
import { ResponseDto } from "../dto/response/response.dto";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { FailureResponseDto } from "../dto/response/failure-response.dto";

@Injectable()
export class EventDatabaseService {

    private database: Loki;
    private initObs: Observable<Loki.Collection>;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private databaseSrv: CoreDatabaseService
    ) {
        this.log = loggerSrv.get("EventDatabaseService");
        this.initObs = this.init();
    }
    public getCurrentSeason(): Observable<ResponseDto> {
        return this.initObs.pipe(
            map (collection => {
                let seasonEvents = collection.find({eventType: BackendConfig.EventTypeEnum.Season});
                return seasonEvents.length;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }
    public setEvent(eventDto: AchievementEventDto): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let event = collection.insert(eventDto);
                if (event) {
                    this.log.d("Saving new event for user: ", eventDto.userHash);
                    ret = this.databaseSrv.save(this.database, collection, event);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    private init() {
        return this.databaseSrv.initDatabase(BackendConfig.EVENT_DB_JSON).pipe(
            tap(database => this.database = database),
            flatMap(database => this.databaseSrv.initCollection(database, BackendConfig.EVENT_COLLECTION)),
            //first() is neccessary so that NestJS controllers can answer Http Requests.
            first(),
            shareReplay(BackendConfig.BUFFER_SIZE)
        );
    }
}
