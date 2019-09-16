import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { LoggerService, ILogger } from "./logger.service";
import { AppVersionService } from "./app-version.service";
import { LocalStorageService } from "./local-storage.service";
import { AppConfig } from "../app.config";

@Injectable()
export class UpdateCheckService {

  public minBetweenChecks: number;
  public msBetweenChecks: number;

  private appVersion: string;
  private log: ILogger;
  private interval: NodeJS.Timer;

  constructor(
    private translateService: TranslateService,
    public appVersionSrv: AppVersionService,
    private storageSrv: LocalStorageService,
    private loggerSrv: LoggerService
  ) {
    this.log = this.loggerSrv.get("UpdateCheckService");
  }

  public start(minutes = AppConfig.UPDATE_CHECK_INTERVAL_MINS) {
    this.minBetweenChecks = minutes;
    this.msBetweenChecks = 1000 * 60 * this.minBetweenChecks;
    this.checkCurrentVersionForUpdates();
    this.interval = setInterval(() => this.checkCurrentVersionForUpdates(), this.msBetweenChecks);
  }

  public stop() {
    clearInterval(this.interval);
  }

  public setCheckInterval(minutes: number) {
    this.stop();
    this.start(minutes);
  }

  private checkCurrentVersionForUpdates() {
    let currentVersion = this.storageSrv.get(AppConfig.StorageKey.LOCALSTORAGEVERSION);
    this.appVersionSrv.getAppVersion().subscribe(
      ver => {
        this.appVersion = ver;
        if (this.appVersion && currentVersion && this.appVersion !== currentVersion) {
          this.translateService.get("app.versionOutdated")
            .subscribe(
              msg => {
                window.alert(msg);
                this.storageSrv.set(AppConfig.StorageKey.LOCALSTORAGEVERSION, this.appVersion);
                window.location.reload(true);
              });
        } else if (currentVersion) {
          this.storageSrv.set(AppConfig.StorageKey.LOCALSTORAGEVERSION, this.appVersion);
        }
      },
      err => {
        this.log.w("No app version plugin detected. Can't check current version");
      }
    );
  }
}
