import { Component } from "@angular/core";

import { CommitPage } from "../commits/commits";
import { ReviewPage } from "../review/review";
import { HomePage } from "../home/home";
import { RankingPage } from "../ranking/ranking";
import { ILogger, LoggerService } from "../../core/logger.service";
import { MenuItem } from "../../models/menu-items.model";

@Component({
    selector: "page-tabs",
    templateUrl: "tabs.html"
})
export class TabsPage {

    public isVisible = true;
    public tabContent: any;

    public home: MenuItem = new MenuItem("home", HomePage);
    public commits: MenuItem = new MenuItem("git-network", CommitPage);
    public reviews: MenuItem = new MenuItem("eye", ReviewPage);
    public ranking: MenuItem = new MenuItem("stats", RankingPage);
    public menuArray = new Array<MenuItem>();
    private log: ILogger;

    constructor(
        loggerSrv: LoggerService
    ) {
        this.menuArray.push(this.home, this.commits, this.reviews, this.ranking);
        this.tabContent = HomePage;
        this.log = loggerSrv.get("TabsPage");
    }
    public goTo(page: any){
        this.tabContent = page;
    }
}
