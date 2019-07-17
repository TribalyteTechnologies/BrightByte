import { Injectable } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import * as Loki from "lokijs";
import { Observable } from "rxjs";
import { UserDto } from "./dto/user.dto";

@Injectable()
export class DatabaseService {

	private database: Loki;
	private collection: Loki.Collection;

	public constructor() {
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
							error => observer.error(BackendConfig.statusFailure),
							() => {
								observer.next(BackendConfig.statusSuccess);
								observer.complete();
							}
						);
					},
					error => observer.error(BackendConfig.statusFailure)
				)
			} else {
				observer.error(BackendConfig.statusFailure)
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
				observer.error(BackendConfig.statusFailure);
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
				observer.error(BackendConfig.statusFailure);
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
							error => observer.error(BackendConfig.statusFailure),
							() => {
								observer.next(BackendConfig.statusSuccess);
								observer.complete();
							}
						);
					},
					error => observer.error(BackendConfig.statusFailure)
				)
			} else {
				observer.error(BackendConfig.statusFailure);
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
							error => observer.error(BackendConfig.statusFailure),
							() => {
								observer.next(BackendConfig.statusSuccess);
								observer.complete();
							}
						);
					},
					error => observer.error(BackendConfig.statusFailure)
				)
			} else {
				observer.error(BackendConfig.statusFailure);
			}
		});
	}

	private async initDatabase() {
		this.database = new Loki(BackendConfig.BRIGHTBYTE_DB_JSON);
		let self = this;
		this.database.loadDatabase({}, function (err) {
			if (err) {
				console.log("Couldn't load the database.")
			} else {
				self.collection = self.database.getCollection(BackendConfig.USER_COLLECTION);
				if (!self.collection) {
					console.log("Collection not found.");
					self.collection = self.database.addCollection(BackendConfig.USER_COLLECTION);
					self.saveDb().subscribe(
						null,
						error => console.log("Can't create new Collection."),
						() => console.log("Created new Collection")
					);
				} else {
					console.log("Collection found.");
				}
			}
		});
	}

	private saveDb(): Observable<any> {
		return new Observable<any>(observer => {
			this.database.saveDatabase(function (err) {
				err ? observer.error() : observer.complete();
			});
		})
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