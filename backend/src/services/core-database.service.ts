import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { BackendConfig } from "../backend.config";

@Injectable()
export class CoreDatabaseService {

    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("CoreDatabaseService");
    }

    public initDatabase(databaseName: string): Observable<Loki> {
        return new Observable<Loki>(observer => {
            let database = new Loki(databaseName);
            database.loadDatabase({}, (err) => {
                if (!err) {
                    this.log.d(databaseName + " database loaded.");
                    observer.next(database);
                    observer.complete();
                } else {
                    this.log.d(databaseName + " database can't be loaded.");
                    observer.error();
                }
            });
        });
    }

    public initCollection(database: Loki, collectionName: string): Observable<Loki.Collection> {
        return new Observable<Loki.Collection>(observer => {
            let collection = database.getCollection(collectionName);
            if (!collection) {
                this.log.d(collectionName + " collection not found.");
                collection = database.addCollection(collectionName);
                this.saveDb(database).subscribe(
                    null,
                    error => {
                        this.log.d(collectionName + " collection creation failed.");
                        observer.error();
                    },
                    () => {
                        this.log.d(collectionName + " collection created.");
                        observer.next(collection);
                    }
                );
            } else {
                this.log.d(collectionName + " collection loaded.");
                observer.next(collection);
            }
        });
    }

    public save(database: Loki, collection: Loki.Collection, document: Loki.KeyValueStore): Observable<string> {
        return new Observable(observer => {
            this.updateCollection(document, collection).subscribe(
                updated => {
                    this.saveDb(database).subscribe(
                        null,
                        error => observer.error(BackendConfig.STATUS_FAILURE),
                        () => {
                            observer.next(BackendConfig.STATUS_SUCCESS);
                            observer.complete();
                        }
                    );
                },
                error => observer.error(BackendConfig.STATUS_FAILURE)
            );
        });
    }

    public saveDb(database: Loki): Observable<any> {
        return new Observable<any>(observer => {
            database.saveDatabase(function (err) {
                err ? observer.error() : observer.complete();
            });
        });
    }

    public updateCollection(user: Loki.KeyValueStore, collection: Loki.Collection): Observable<string> {
        return new Observable<any>(observer => {
            try {
                collection.update(user);
                observer.next();
                observer.complete();
            } catch {
                observer.error();
            }
        });
    }
}
