import { Injectable } from '@nestjs/common';
import { BackendConfig } from 'src/backend.config';
import * as Loki from 'lokijs';

@Injectable()
export class DatabaseService {
  private database: Loki;
  private collection: Loki.Collection;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase() {
    this.database = new Loki(BackendConfig.BRIGHTBYTE_DB_JSON);
    let self = this;
    this.database.loadDatabase({}, function (err) {
      if (err) {
        console.log("Couldn't load the database.")
      }
      else {
        let success: boolean = false;
        self.collection = self.database.getCollection(BackendConfig.BRIGHTBYTE_DB_COLLECTION);
        if (!self.collection) {
          console.log("Collection not found.");
          self.collection = self.database.addCollection(BackendConfig.BRIGHTBYTE_DB_COLLECTION);
          success = self.saveDB();
        }
        else {
          success = true;
          console.log("Collection found.");
        }
        if (success) {
          console.log('Database successfully initialized.')
        }
        else {
          console.log("Couldn't initialize the database.");
        }
      }
    });
  }

  private saveDB(): boolean {
    let saved: boolean = true;
    this.database.saveDatabase(function (err) {
      if (err) {
        saved = false;
      }
    });
    return saved;
  }

  private updateCollection(user: Loki.KeyValueStore): boolean {
    let updated: boolean;
    try {
      this.collection.update(user);
      updated = true;
    }
    catch{
      updated = false;
    }
    return updated;
  }

  async createUser(userIdentifier: string) {
    let created: boolean = false;
    let user = this.collection.findOne({
      name: userIdentifier
    });
    if (user == null) {
      user = this.collection.insert({
        name: userIdentifier,
        commitNumber: 0,
        reviewNumber: 0
      });
      if (user) {
        created = this.updateCollection(user);
        if (created) {
          created = this.saveDB();
        }
      }
    }
    return created;
  }

  async getCommitNumber(userIdentifier: string) {
    let response: number;
    let user = this.collection.findOne({
      name: userIdentifier
    });
    if (user) {
      response = user.commitNumber;
    }
    else {
      response = null;
    }
    return response;
  }

  async getReviewNumber(userIdentifier: string) {
    let response: number;
    let user = this.collection.findOne({
      name: userIdentifier
    });
    if (user) {
      response = user.reviewNumber;
    }
    else {
      response = null;
    }
    return response;
  }

  async setCommitNumber(userIdentifier: string, num: number) {
    let set: boolean = false;
    let user = this.collection.findOne({
      name: userIdentifier
    });
    if (user == null) {
      user = this.collection.insert({
        name: userIdentifier,
        commitNumber: num,
        reviewNumber: 0
      });
      if (user) {
        set = this.updateCollection(user);
        if (set) {
          set = this.saveDB();
        }
      }
    }
    else {
      user.commitNumber = num;
      set = this.updateCollection(user);
      if (set) {
        set = this.saveDB();
      }
    }
    return set;
  }

  async setReviewNumber(userIdentifier: string, num: number) {
    let set: boolean = false;
    let user = this.collection.findOne({
      name: userIdentifier
    });
    if (user == null) {
      user = this.collection.insert({
        name: userIdentifier,
        commitNumber: 0,
        reviewNumber: num
      });
      if (user) {
        set = this.updateCollection(user);
        if (set) {
          set = this.saveDB();
        }
      }
    }
    else {
      user.reviewNumber = num;
      set = this.updateCollection(user);
      if (set) {
        set = this.saveDB();
      }
    }
    return set;
  }
}
