import {LoggerService} from "./logger.service";
import { StorageService } from "./storage.service";
import {Injectable} from "@angular/core";

@Injectable()
export class LocalStorageService extends StorageService {

    constructor(loggerSrv: LoggerService) {
        super(StorageService.StorageTypeEnum.Local, loggerSrv);
    }
}
