import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { LoggerService, ILogger } from "./logger.service";
import { AppVersionService } from "./app-version.service";
import { LocalStorageService } from "./local-storage.service";
import { AppConfig } from "../app.config";

@Injectable()
export class UpdateCheckService {

  public readonly MIN_BETWEEN_CHECKS = 10;
  public readonly MS_BETWEEN_CHECKS = 1000 * 60 * this.MIN_BETWEEN_CHECKS;
  
  private currentVersion: string;
  private appVersion: string;
  private log: ILogger;

  constructor(
  private translateService: TranslateService,
  public appVersionSrv: AppVersionService,
  private storageSrv: LocalStorageService,
  private loggerSrv: LoggerService
  ) {
    this.log = this.loggerSrv.get("UpdateCkeckService");
  }

  public startVersionCheckThread(){
    this.checkCurrentVersion();
    setInterval(() => this.checkCurrentVersion(), this.MS_BETWEEN_CHECKS);
  }

  private checkCurrentVersion(){
    this.currentVersion = this.storageSrv.get(AppConfig.StorageKey.LOCALSTORAGEVERSION);
    this.appVersionSrv.getAppVersion().subscribe(
            ver => {
                this.appVersion = ver;
                if (this.appVersion && this.currentVersion && this.appVersion !== this.currentVersion){
                    this.translateService.get("app.versionOutdated").subscribe(
                        msg => {
                            window.alert(msg);
                            this.storageSrv.set(AppConfig.StorageKey.LOCALSTORAGEVERSION, this.appVersion);
                            window.location.reload(true);
                        });   
                }else if (!this.currentVersion) {
                    this.storageSrv.set(AppConfig.StorageKey.LOCALSTORAGEVERSION, this.appVersion);
                }
            },
            err => {
              this.log.w("No app version could be detected");
            }
        );
  }
}
