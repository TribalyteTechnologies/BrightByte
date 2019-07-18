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

    private async initDatabase() {
        this.database = new Loki(BackendConfig.BRIGHTBYTE_DB_JSON);
        this.database.loadDatabase({}, (err) => {
            if (err) {
                this.log.d("Couldn't load the database.");
            } else {
                this.collection = this.database.getCollection(BackendConfig.ACHIEVEMENT_COLLECTION);
                if (!this.collection) {
                    this.log.d("Collection not found.");
                    this.collection = this.database.addCollection(BackendConfig.ACHIEVEMENT_COLLECTION);
                    this.saveDb().subscribe(
                        null,
                        error => this.log.d("Can't create new Collection."),
                        () => this.log.d("Created new Collection")
                    );
                } else {
                    this.log.d("Collection found.");
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
