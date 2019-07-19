import { Injectable } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import * as Loki from "lokijs";
import { Observable } from "rxjs";
import { ILogger, LoggerService } from "../logger/logger.service";

@Injectable()
export class AchievementDatabaseService {

    private database: Loki;
    private collection: Loki.Collection;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("AchievementDatabaseService");
        this.initDatabase();
    }

    private initDatabase() {
        this.database = new Loki(BackendConfig.ACHIEVEMENT_DB_JSON);
        this.database.loadDatabase({}, (err) => {
            if (err) {
                this.log.d(BackendConfig.DATABASE_LOADING_ERROR);
            } else {
                this.collection = this.database.getCollection(BackendConfig.ACHIEVEMENT_COLLECTION);
                if (!this.collection) {
                    this.log.d(BackendConfig.COLLECTION_NOT_FOUND);
                    this.collection = this.database.addCollection(BackendConfig.ACHIEVEMENT_COLLECTION);
                    this.saveDb().subscribe(
                        null,
                        error => this.log.d(BackendConfig.COLLECTION_NOT_CREATED),
                        () => this.log.d(BackendConfig.COLLECTION_CREATED)
                    );
                } else {
                    this.log.d(BackendConfig.COLLECTION_LOADED);
                }
            }
        });
    }

    private saveDb(): Observable<any> {
        return new Observable<any>(observer => {
            this.database.saveDatabase(function (err) {
                err ? observer.error() : observer.complete();
            });
        });
    }
}
