import { Injectable } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { ILogger, LoggerService } from "../logger/logger.service";
import Loki from "lokijs";
import { BackendConfig } from "../backend.config";
import { flatMap } from "rxjs/operators";

@Injectable()
export class CoreDatabaseService {

    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("CoreDatabaseService");
    }

    public save(database: Loki, collection: Loki.Collection, document: Loki.KeyValueStore): Observable<string> {
        let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
        ret = this.updateCollection(document, collection).pipe(flatMap(() => this.saveDb(database)));
        return ret;
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
        let ret: Observable<Loki.Collection> = throwError(BackendConfig.STATUS_FAILURE);
        ret = new Observable<Loki.Collection>(observer => {
            let collection = database.getCollection(collectionName);
            if (!collection) {
                this.log.d(collectionName + " collection not found.");
                collection = database.addCollection(collectionName);
                this.saveDb(database).subscribe(
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
        return ret;
    }

    private saveDb(database: Loki): Observable<string> {
        return new Observable<any>(observer => {
            database.saveDatabase(err => {
                if (!err) {
                    observer.next(BackendConfig.STATUS_SUCCESS);
                    observer.complete();
                } else {
                    observer.error(BackendConfig.STATUS_FAILURE);
                }
            });
        });
    }

    private updateCollection(doc: Loki.KeyValueStore, collection: Loki.Collection): Observable<string> {
        return new Observable<any>(observer => {
            try {
                collection.update(doc);
                observer.next(BackendConfig.STATUS_SUCCESS);
                observer.complete();
            } catch {
                observer.error(BackendConfig.STATUS_FAILURE);
            }
        });
    }
}
