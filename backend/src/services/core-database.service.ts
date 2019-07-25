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
        this.log = loggerSrv.get("DatabaseService");
    }

    public initDatabase(nameDatabase: string): Observable<Loki> {
        return new Observable<Loki>(observer => {
            let database = new Loki(nameDatabase);
            database.loadDatabase({}, (err) => {
                if (!err) {
                    this.log.d(nameDatabase + " database loaded.");
                    observer.next(database);
                    observer.complete();
                } else {
                    this.log.d("Can't load database.");
                    observer.error();
                }
            });
        });
    }

    public initCollection(database: Loki, nameCollection: string): Observable<Loki.Collection> {
        return new Observable<Loki.Collection>(observer => {
            let collection = database.getCollection(nameCollection);
            if (!collection) {
                this.log.d("Collection not found.");
                collection = database.addCollection(nameCollection);
                this.saveDb(database).subscribe(
                    null,
                    error => {
                        this.log.d("Collection creation failed.");
                        observer.error();
                    },
                    () => {
                        this.log.d("Collection created.");
                        observer.next(collection);
                    }
                );
            } else {
                this.log.d(nameCollection + " collection loaded.");
                observer.next(collection);
            }
        });
    }

    public save(database, collection, document): Observable<any> {
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

    public updateCollection(user: Loki.KeyValueStore, collection: Loki.Collection): Observable<any> {
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
