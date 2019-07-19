import { Injectable } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import * as Loki from "lokijs";
import { Observable } from "rxjs";
import { UserDto } from "../dto/user.dto";
import { ILogger, LoggerService } from "../logger/logger.service";

@Injectable()
export class UserDatabaseService {

    private database: Loki;
    private collection: Loki.Collection;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("UserDatabaseService");
        this.initDatabase();
    }

    public createUser(userIdentifier: string): Observable<string> {
        return new Observable(observer => {
            let user = this.collection.findOne({ id: userIdentifier });
            if (!user) {
                user = this.collection.insert(new UserDto(userIdentifier, 0, 0));
                this.updateCollection(user).subscribe(
                    updated => {
                        this.saveDb().subscribe(
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
            } else {
                observer.error(BackendConfig.STATUS_FAILURE);
            }
        });
    }

    public getCommitNumber(userIdentifier: string): Observable<number> {
        return new Observable(observer => {
            let user = this.collection.findOne({ id: userIdentifier });
            if (user) {
                observer.next(user.commitCount);
                observer.complete();
            } else {
                observer.error(BackendConfig.STATUS_FAILURE);
            }
        });
    }

    public getReviewNumber(userIdentifier: string): Observable<number> {
        return new Observable(observer => {
            let user = this.collection.findOne({ id: userIdentifier });
            if (user) {
                observer.next(user.reviewCount);
                observer.complete();
            } else {
                observer.error(BackendConfig.STATUS_FAILURE);
            }
        });
    }

    public setCommitNumber(userIdentifier: string, num: number): Observable<string> {
        return new Observable(observer => {
            let user = this.collection.findOne({ id: userIdentifier });
            if (user) {
                user.commitCount = num;
            } else {
                user = this.collection.insert(new UserDto(userIdentifier, num, 0));
            }
            if (user) {
                this.updateCollection(user).subscribe(
                    updated => {
                        this.saveDb().subscribe(
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
            } else {
                observer.error(BackendConfig.STATUS_FAILURE);
            }
        });
    }

    public setReviewNumber(userIdentifier: string, num: number): Observable<string> {
        return new Observable(observer => {
            let user = this.collection.findOne({
                id: userIdentifier
            });
            if (user) {
                user.reviewCount = num;
            } else {
                user = this.collection.insert(new UserDto(userIdentifier, 0, num));
            }
            if (user) {
                this.updateCollection(user).subscribe(
                    updated => {
                        this.saveDb().subscribe(
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
            } else {
                observer.error(BackendConfig.STATUS_FAILURE);
            }
        });
    }

    private initDatabase() {
        this.database = new Loki(BackendConfig.USER_DB_JSON);
        this.database.loadDatabase({}, (err) => {
            if (err) {
                this.log.d(BackendConfig.DATABASE_LOADING_ERROR);
            } else {
                this.collection = this.database.getCollection(BackendConfig.USER_COLLECTION);
                if (!this.collection) {
                    this.log.d(BackendConfig.COLLECTION_NOT_FOUND);
                    this.collection = this.database.addCollection(BackendConfig.USER_COLLECTION);
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

    private updateCollection(user: Loki.KeyValueStore): Observable<any> {
        return new Observable<any>(observer => {
            try {
                this.collection.update(user);
                observer.next();
                observer.complete();
            } catch {
                observer.error();
            }
        });
    }
}
