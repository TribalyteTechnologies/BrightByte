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


const LASTPAGE: string = "lastPage";

@Component({
    selector: "page-tabs",
    templateUrl: "tabs.html"
})
export class TabsPage {

    public isVisible = true;
    public currentPage: any;

    public home: MenuItem = new MenuItem("home", HomePage);
    public commits: MenuItem = new MenuItem("git-network", CommitPage);
    public reviews: MenuItem = new MenuItem("eye", ReviewPage);
    public ranking: MenuItem = new MenuItem("stats", RankingPage); 
    public menuArray = new Array<MenuItem>();
    public name: string = "";
    private log: ILogger;

    constructor(loggerSrv: LoggerService,
                private userLoggerService: UserLoggerService,
                private navCtrl: NavController, 
                private loginService: LoginService, 
                private contractManagerService: ContractManagerService) {
        this.log = loggerSrv.get("TabsPage");
        this.menuArray.push(this.home, this.commits, this.reviews, this.ranking);
        let lastPage = Number(localStorage.getItem(LASTPAGE));
        if (lastPage){
            this.currentPage = this.menuArray[lastPage].url;
            this.goTo(this.menuArray[lastPage].url);
        } else {
            this.currentPage = this.ranking;
        }
        this.setUserInfo();
    }
    
    public goTo(page: any){
        let idx = this.menuArray.map(x => x.url).indexOf(page);
        this.currentPage = page;
        localStorage.setItem(LASTPAGE, String(idx));
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
