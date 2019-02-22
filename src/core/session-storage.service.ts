import {LoggerService} from "./logger.service";
import { StorageService } from "./storage.service";
import {Injectable} from "@angular/core";

@Injectable()
export class SessionStorageService extends StorageService {

    constructor(loggerSrv: LoggerService) {
        super(loggerSrv);
        this.storage = sessionStorage;
    }
}
