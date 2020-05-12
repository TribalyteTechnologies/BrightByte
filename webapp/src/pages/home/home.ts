import { Component} from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { LoginService } from "../../core/login.service";
import { TranslateService } from "@ngx-translate/core";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TabsPage } from "../tabs/tabs";
import { CommitPage } from "../commits/commits";
import { ReviewPage } from "../review/review";
import { RankingPage } from "../ranking/ranking";


@Component({
    selector: "page-home",
    templateUrl: "home.html"
})
export class HomePage {

    public userName: string;
    public teamName: string;

    private log: ILogger;
    private user;

    constructor(
        public navCtrl: NavController,
        loggerSrv: LoggerService,
        public translateService: TranslateService,
        private contractManagerService: ContractManagerService,
        private loginService: LoginService,
        private tabsPage: TabsPage
    ) {
        this.log = loggerSrv.get("HomePage");
        
    }

    public ionViewWillEnter(){
        this.refresh();
    }

    public refresh() {
        this.user = this.loginService.getAccount();
        this.contractManagerService.getUserDetails(this.user.address)
        .then((user) => {
            this.userName = user.name;
            return this.contractManagerService.getCurrentTeamName();
        })
        .then(teamName => {
            this.teamName =  teamName;
        });
    }

    public goPage(page: string){
        if(page === "CommitPage") {
            this.tabsPage.goTo(CommitPage);
        } else if(page === "ReviewPage") {
            this.tabsPage.goTo(ReviewPage);
        } else if(page === "RankingPage") {
            this.tabsPage.goTo(RankingPage);
        }
    }

}
