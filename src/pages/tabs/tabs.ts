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

@Component({
    selector: "page-tabs",
    templateUrl: "tabs.html"
})
export class TabsPage {

    public isVisible = true;
    public tabContent: any;

    public home: MenuItem = new MenuItem("home", HomePage, "menu-button-style");
    public commits: MenuItem = new MenuItem("git-network", CommitPage, "menu-button-style");
    public reviews: MenuItem = new MenuItem("eye", ReviewPage, "menu-button-style");
    public ranking: MenuItem = new MenuItem("stats", RankingPage, "menu-button-style-selected"); 
    public menuArray = new Array<MenuItem>();
    public name: string = "";
    private log: ILogger;

    constructor(loggerSrv: LoggerService,
                private userLoggerService: UserLoggerService,
                private navCtrl: NavController, 
                private loginService: LoginService, 
                private contractManagerService: ContractManagerService) {
        this.menuArray.push(this.home, this.commits, this.reviews, this.ranking);
        
        let lastPage = Number(localStorage.getItem("lastPage"));
        if (lastPage !== undefined){
            this.tabContent = this.menuArray[lastPage].url;
            this.goTo(this.menuArray[lastPage].url);
        } else {
            this.tabContent = this.ranking;
        }
        
        this.log = loggerSrv.get("TabsPage");
        this.setUserInfo();
    }
    
    public goTo(page: any){
        this.menuArray.forEach((menuPage) => {
            menuPage.style = "menu-button-style";
        });
        let idx = this.menuArray.map(x => x.url).indexOf(page);
        this.menuArray[idx].style = "menu-button-style-selected";
        this.tabContent = page;
        localStorage.setItem("lastPage", String(idx));
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
