import { Injectable } from "@nestjs/common";
import { Observable, throwError, of } from "rxjs";
import { flatMap, tap, map } from "rxjs/operators";
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

    public save<E extends object>(database: Loki, collection: Loki.Collection<E>, document: E): Observable<string> {
        return this.updateCollection<E>(document, collection).pipe(
            flatMap(() => this.saveDb(database))
        );
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

    public initCollection<E extends object>(database: Loki, collectionName: string): Observable<Loki.Collection<E>> {
        let ret: Observable<Loki.Collection<E>>;
        let collection = database.getCollection<E>(collectionName);
        if(collection) {
            this.log.d(collectionName + " collection loaded.");
            ret = of(collection);
        } else {
            this.log.d(collectionName + " collection not found.");
            collection = database.addCollection<E>(collectionName);
            ret = this.saveDb(database).pipe(
                tap(() => this.log.d(collectionName + " collection created.")),
                map(() => collection)
            );
        }
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

    private updateCollection<E extends object>(doc: E, collection: Loki.Collection<E>): Observable<string> {
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
