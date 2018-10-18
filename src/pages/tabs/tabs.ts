import { Component } from "@angular/core";

import { CommitPage } from "../commits/commits";
import { ReviewPage } from "../review/review";
import { HomePage } from "../home/home";
import { RankingPage } from "../ranking/ranking";
import { ILogger, LoggerService } from "../../core/logger.service";

@Component({
    selector: "page-tabs",
    templateUrl: "tabs.html"
})
export class TabsPage {

    public isVisible: boolean = true;

    public tab1Root = HomePage;
    public tab2Root = CommitPage;
    public tab3Root = ReviewPage;
    public tab4Root = RankingPage;

    public indice = 0;
    private log: ILogger;

    constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("TabsPage");

    }

     public returnPage(idx: number){
        switch(idx){
            case 0: {
                return this.tab1Root;
            }
            case 1: {
                return this.tab2Root;
            }
            case 2: {
                return this.tab3Root;
            }
            case 3: {
                return this.tab4Root;
            }
            default: {
                return this.tab1Root;
            }

        }

    }
}
