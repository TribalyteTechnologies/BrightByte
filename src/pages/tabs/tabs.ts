import { Component } from "@angular/core";

import { CommitPage } from "../commits/commits";
import { ReviewPage } from "../review/review";
import { HomePage } from "../home/home";
import { RankingPage } from "../ranking/ranking";
import { ILogger, LoggerService } from "../../core/logger.service";
import { MenuItem } from "../../models/menu-items.model";
import { LoginService } from "../../core/login.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { LoginPage } from "../login/login";
import { NavController } from "ionic-angular";
import { UserLoggerService } from "../../domain/user-logger.service";
import { LocalStorageService } from "../../core/local-storage.service";
import { AppConfig } from "../../app.config";

@Component({
    selector: "page-tabs",
    templateUrl: "tabs.html"
})
export class TabsPage {

    public isVisible = true;
    public currentPage: any;
    public tabContent: any;

    public home: MenuItem = new MenuItem("home.svg", HomePage, "Home");
    public commits: MenuItem = new MenuItem("commits.svg", CommitPage, "Commits");
    public reviews: MenuItem = new MenuItem("reviews.svg", ReviewPage, "Reviews");
    public ranking: MenuItem = new MenuItem("ranking.svg", RankingPage, "Ranking"); 
    public menuArray = new Array<MenuItem>();
    public name: string = "";
    private log: ILogger;

    constructor(loggerSrv: LoggerService,
                private userLoggerService: UserLoggerService,
                private navCtrl: NavController, 
                private loginService: LoginService, 
                private contractManagerService: ContractManagerService,
                private storageSrv: LocalStorageService) {
        this.log = loggerSrv.get("TabsPage");
        this.menuArray.push(this.home, this.commits, this.reviews, this.ranking);

        let url = new URLSearchParams(document.location.search);
        let item = this.storageSrv.get(AppConfig.StorageKey.LASTPAGE );
        let lastPageNumber = Number(item);
        if (item === null){
            this.tabContent = this.ranking.url;
            this.goTo(this.ranking.url);
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
    
    public goTo(page: any){
        let idx = this.menuArray.map(x => x.url).indexOf(page);
        this.currentPage = page;
        this.storageSrv.set(AppConfig.StorageKey.LASTPAGE , String(idx));
    }

    public logout(){
        this.userLoggerService.logout();
        this.navCtrl.setRoot(LoginPage);
    }

    private setUserInfo(){
        let user = this.loginService.getAccount();
        this.contractManagerService.getUserDetails(user.address).then(rsp => {
            this.name = rsp.name;
        });
    }
}
