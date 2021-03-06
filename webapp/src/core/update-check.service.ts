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

    private readonly CHECK_PATH = AppConfig.IS_CHECKING_PATH_ENABLED ? "latest" : undefined;

    private appVersion: string;
    private log: ILogger;
    private interval: NodeJS.Timer;

    constructor(
        loggerSrv: LoggerService,
        private translateService: TranslateService,
        private appVersionSrv: AppVersionService,
        private storageSrv: LocalStorageService
    ) {
        this.log = loggerSrv.get("UpdateCheckService");
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
                const urlPath = (window.location.pathname).replace(/\//g, "");
                this.appVersion = ver;
                if (currentVersion === AppConfig.StorageKey.APPJUSTUPDATED) {
                    this.storageSrv.set(AppConfig.StorageKey.LOCALSTORAGEVERSION, this.appVersion);
                } else if (this.appVersion && currentVersion && this.appVersion !== currentVersion && this.CHECK_PATH === urlPath) {
                    this.translateService.get("app.versionOutdated")
                        .subscribe(
                            msg => {
                                window.alert(msg);
                                let isAfterLoginShown = this.storageSrv.get(AppConfig.StorageKey.AFTERLOGINTUTORIALVISITED);
                                let isRegisterShown = this.storageSrv.get(AppConfig.StorageKey.REGISTERTUTORIALVISITED);
                                window.location.reload();
                                this.storageSrv.set(AppConfig.StorageKey.LOCALSTORAGEVERSION, AppConfig.StorageKey.APPJUSTUPDATED);
                                if (isAfterLoginShown) {
                                    this.storageSrv.set(AppConfig.StorageKey.AFTERLOGINTUTORIALVISITED, isAfterLoginShown);
                                }
                                if (isRegisterShown) {
                                    this.storageSrv.set(AppConfig.StorageKey.REGISTERTUTORIALVISITED, isRegisterShown);
                                }
                            });
                } else if (currentVersion) {
                    this.storageSrv.set(AppConfig.StorageKey.LOCALSTORAGEVERSION, currentVersion);
                } else {
                    this.storageSrv.set(AppConfig.StorageKey.LOCALSTORAGEVERSION, this.appVersion);
                }
            },
            err => {
                this.log.w("No app version plugin detected. Can't check current version");
            }
        );
    }
}
