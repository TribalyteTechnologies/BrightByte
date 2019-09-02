import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { Observable, throwError, of } from "rxjs";
import { flatMap, tap, map, first, catchError } from "rxjs/operators";
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
        
        this.init().subscribe(res => this.log.d("The Event Data Base is ready"));
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
                    ret = this.databaseSrv.save(this.database, collection, event);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    private init(): Observable<Loki.Collection> {
        return this.databaseSrv.initDatabase(BackendConfig.EVENT_DB_JSON).pipe(
            tap(database => this.database = database),
            flatMap(database => this.databaseSrv.initCollection(database, BackendConfig.EVENT_COLLECTION)),
            //first() is neccessary so that NestJS controllers can answer Http Requests.
            first(),
            tap(collection => this.initObs = of(collection))
        );
    }
}
