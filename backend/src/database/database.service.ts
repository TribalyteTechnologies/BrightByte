import { Injectable } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import * as Loki from "lokijs";
import { Observable, of } from "rxjs";

@Injectable()
export class DatabaseService {

	private database: Loki;
	private collection: Loki.Collection;

	public constructor() {
		this.initDatabase();
	}

	public createUser(userIdentifier: string): Observable<string> {
		return new Observable(observer => {
			let user = this.collection.findOne({
				name: userIdentifier
			});
			if (!user) {
				user = this.collection.insert({
					name: userIdentifier,
					commitNumber: 0,
					reviewNumber: 0
				});
				this.updateCollection(user).subscribe(
					updated => {
						this.saveDb().subscribe(
							saved => {
								observer.next(BackendConfig.statusSuccess);
								observer.complete();
							},
							error => observer.error(BackendConfig.statusFailure)
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
			let user = this.collection.findOne({
				name: userIdentifier
			});
			if (user) {
				observer.next(user.commitNumber);
				observer.complete();
			} else {
				observer.error(BackendConfig.statusFailure);
			}
		});
	}

	public getReviewNumber(userIdentifier: string): Observable<number> {
		return new Observable(observer => {
			let user = this.collection.findOne({
				name: userIdentifier
			});
			if (user) {
				observer.next(user.reviewNumber);
				observer.complete();
			} else {
				observer.error(BackendConfig.statusFailure);
			}
		});
	}

	public setCommitNumber(userIdentifier: string, num: number): Observable<string> {
		return new Observable(observer => {
			let user = this.collection.findOne({
				name: userIdentifier
			});
			if (user) {
				user.commitNumber = num;
			} else {
				user = this.collection.insert({
					name: userIdentifier,
					commitNumber: num,
					reviewNumber: 0
				});
			}
			if (user) {
				this.updateCollection(user).subscribe(
					updated => {
						this.saveDb().subscribe(
							saved => {
								observer.next(BackendConfig.statusSuccess);
								observer.complete();
							},
							error => observer.error(BackendConfig.statusFailure),
						);
					}, 
					error => observer.error(BackendConfig.statusFailure)
				)
			}
		});
	}

	public setReviewNumber(userIdentifier: string, num: number): Observable<string> {
		return new Observable(observer => {
			let user = this.collection.findOne({
				name: userIdentifier
			});
			if (user) {
				user.commitNumber = num;
			} else {
				user = this.collection.insert({
					name: userIdentifier,
					commitNumber: 0,
					reviewNumber: num
				});
			}
			if (user) {
				this.updateCollection(user).subscribe(
					updated => {
						this.saveDb().subscribe(
							saved => {
								observer.next(BackendConfig.statusSuccess);
								observer.complete();
							},
							error => observer.error(BackendConfig.statusFailure),
						);
					}, 
					error => observer.error(BackendConfig.statusFailure)
				)
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
						saved => console.log("Created new Collection"),
						error => console.log("Can't create new Collection.")
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
				if (err) {
					observer.error();
				} else {
					observer.next();
					observer.complete();
				}
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