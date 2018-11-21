import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { LoginService } from "../../core/login.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { Account } from "web3/types";
import { UserDetails } from "../../models/user-details.model";
import { UserReputation } from "../../models/user-reputation.model";
import { AppConfig } from "../../app.config";

@Component({
    selector: "page-ranking",
    templateUrl: "ranking.html"
})
export class RankingPage {
    public userDetails = new UserDetails();
    public msg: string;
    public usersRep = new Array<UserReputation>();
    public numberUserList = AppConfig.N_USER_RANKING_LIST;
    private log: ILogger;
    private account: Account;

    constructor(
        public navCtrl: NavController,
        loggerSrv: LoggerService,
        public translateService: TranslateService,
        private contractManagerService: ContractManagerService,
        private loginService: LoginService
    ) {
        this.log = loggerSrv.get("RankingPage");
        this.account = this.loginService.getAccount();
        this.log.d("Imported account: ", this.account);
    }
    public ionViewWillEnter() {
        this.log.d("Imported account: ", this.account);

        this.contractManagerService.getUserDetails(this.account.address)
            .then((detailsUser: UserDetails) => {
                this.log.d("User data obtained: ", detailsUser);
                this.userDetails = detailsUser;
            }).catch((e) => {
                this.translateService.get("ranking.getUserInfo").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
        this.contractManagerService.getAllUserReputation()
            .then((usersRep: UserReputation[]) => {
                this.log.d("Users reputation obtained: ", usersRep);
                this.usersRep = usersRep.sort((a, b) => { return b.reputation - a.reputation; });
                this.log.d("Array of usersRep organized: ", this.usersRep);
            }).catch((e) => {
                this.translateService.get("ranking.getReputation").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
        

    }
}
