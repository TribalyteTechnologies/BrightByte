import { Component } from "@angular/core";

import { CommitPage } from "../commits/commits";
import { ReviewPage } from "../review/review";
import { HomePage } from "../home/home";
import { RankingPage } from "../ranking/ranking";
import { ILogger, LoggerService } from "../../core/logger.service";

@Component({
    templateUrl: "tabs.html"
})
export class TabsPage {

    public tab1Root = HomePage;
    public tab2Root = CommitPage;
    public tab3Root = ReviewPage;
    public tab4Root = RankingPage;
    private log: ILogger;

    constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("TabsPage");

    }
}
