import { Component } from "@angular/core";
import { CommitPage } from "../commits/commits";
import { ReviewPage } from "../review/review";
import { HomePage } from "../home/home";
import { RankingPage } from "../ranking/ranking";
import { ILogger, LoggerService } from "../../core/logger.service";
import { MenuItem } from "../../models/menu-items.model";
import { LoginService } from "../../core/login.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { UserLoggerService } from "../../domain/user-logger.service";
import { LocalStorageService } from "../../core/local-storage.service";
import { AppConfig } from "../../app.config";
import { WebSocketService } from "../../core/websocket.service";
import { TranslateService } from "@ngx-translate/core";
import { Observable } from "rxjs";
import { AvatarService } from "../../domain/avatar.service";
import { PopupService } from "../../domain/popup.service";

@Component({
    selector: "page-tabs",
    templateUrl: "tabs.html"
})
export class TabsPage {

    public readonly IS_SHARING = AppConfig.IS_SHARING_ENABLED;
    public readonly RANKING_PAGE_INDEX = "3";
    public readonly HOME_PAGE_INDEX = "0";

    public isVisible = true;
    public currentPage: any;
    public tabContent: any;
    public contribute = new MenuItem("add.svg", null, "contribute");
    public home = new MenuItem("home.svg", HomePage, "home");
    public commits = new MenuItem("commits.svg", CommitPage, "commits");
    public reviews = new MenuItem("reviews.svg", ReviewPage, "reviews");
    public ranking = new MenuItem("ranking.svg", RankingPage, "ranking");
    
    public menuArray = new Array<MenuItem>();
    public name: string = "";
    private log: ILogger;
    private avatarObs: Observable<string>;



    constructor(
        loggerSrv: LoggerService,
        private userLoggerService: UserLoggerService,
        private popUpService: PopupService,
        private loginService: LoginService,
        private contractManagerService: ContractManagerService,
        private storageSrv: LocalStorageService,
        private websocketSrv: WebSocketService,
        private translateSrv: TranslateService,
        private avatarSrv: AvatarService
    ) {
        this.log = loggerSrv.get("TabsPage");

        this.translateSrv.get("app." + this.contribute.pagName).subscribe((rsp) => {
            this.contribute.pagName = rsp;
        });

        this.menuArray.push(this.home, this.commits, this.reviews, this.ranking);

        let arrayLength = this.menuArray.length;
        for (let i = 0; i < arrayLength; i++){
            this.translateSrv.get("app." + this.menuArray[i].pagName).subscribe((rsp) => {
                this.menuArray[i].pagName = rsp;
            });
        }

        let url = new URLSearchParams(document.location.search);
        let item = this.storageSrv.get(AppConfig.StorageKey.LASTPAGE);
        let lastPageNumber = Number(item);
        if (item === null) {
            this.tabContent = this.home.url;
            this.goTo(this.home.url);
        } else if (url.has("reviewId")) {
            this.goTo(ReviewPage);
        } else if (url.has("commitId")) {
            this.goTo(CommitPage);
        } else {
            this.tabContent = this.menuArray[lastPageNumber].url;
            this.goTo(this.menuArray[lastPageNumber].url);
        }
        this.setUserInfo();
    }

    public ngOnInit(){
        this.avatarObs = this.avatarSrv.getAvatarObs(this.loginService.getAccountAddress());
        if(!this.storageSrv.get(AppConfig.StorageKey.AFTERLOGINTUTORIALVISITED)) {
            this.openAfterLoginTutorialDialog();
        }
    }

    public goTo(page: any) {
        let idx = this.menuArray.map(x => x.url).indexOf(page);
        this.currentPage = page;
        this.storageSrv.set(AppConfig.StorageKey.LASTPAGE, String(idx));
    }

    public logout() {
        this.websocketSrv.disconnect();
        this.userLoggerService.logout();
        window.location.href = window.location.origin;
    }

    public openAddCommitDialog() {
        this.popUpService.openAddCommitDialog();
    }

    public openAfterLoginTutorialDialog() {
        this.popUpService.openAfterLoginTutorialDialog();
    }

    public openSetProfileDialog() {
        this.popUpService.openSetProfileDialog();
    }

    public showSharingDialog() {
        this.popUpService.showSharingDialog();
    }

    private setUserInfo() {
        let user = this.loginService.getAccount();
        this.contractManagerService.getUserDetails(user.address).then(rsp => {
            this.name = rsp.name;
        });
    }
}
