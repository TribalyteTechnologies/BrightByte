import { Injectable } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { Observable, throwError } from "rxjs";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { CoreDatabaseService } from "./core-database.service";
import { AchievementEventDto } from "src/dto/achievement-event.dto";

@Injectable()
export class EventDatabaseService {

    private database: Loki;
    private collection: Loki.Collection;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private databaseSrv: CoreDatabaseService
    ) {
        this.log = loggerSrv.get("EventDatabaseService");
        this.init();
    }

    public setEvent(eventDto: AchievementEventDto): Observable<string> {
        let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
        let event = this.collection.insert(eventDto);
        if (event) {
            ret = this.databaseSrv.save(this.database, this.collection, event);
        }
        return ret;
    }

    private init() {
        this.databaseSrv.initDatabase(BackendConfig.EVENT_DB_JSON).subscribe(
            database => {
                this.database = database;
                this.databaseSrv.initCollection(database, BackendConfig.EVENT_COLLECTION).subscribe(
                    collection => {
                        this.collection = collection;
                    }
                );
            }

        );
    }
}
