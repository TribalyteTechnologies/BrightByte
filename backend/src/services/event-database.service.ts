import { Injectable } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { Observable } from "rxjs";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { CoreDatabaseService } from "./core-database.service";
import { AchievementEventDto } from "src/dto/achievementEvent.dto";

@Injectable()
export class EventDatabaseService {

    private database: Loki;
    private collection: Loki.Collection;
    private log: ILogger;
    private databaseService: CoreDatabaseService;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("EventDatabaseService");
        this.databaseService = new CoreDatabaseService(loggerSrv);
        this.init();
    }

    public setEvent(eventDto: AchievementEventDto): Observable<string> {
        let ret: Observable<string> = new Observable(observer => observer.error(BackendConfig.STATUS_FAILURE));
        let event = this.collection.insert(eventDto);
        if (event) {
            ret = this.databaseService.save(this.database, this.collection, event);
        }
        return ret;
    }

    private init() {
        this.databaseService.initDatabase(BackendConfig.EVENT_DB_JSON).subscribe(
            database => {
                this.database = database;
                this.databaseService.initCollection(database, BackendConfig.EVENT_COLLECTION).subscribe(
                    collection => {
                        this.collection = collection;
                    }
                );
            }

        );
    }
}
