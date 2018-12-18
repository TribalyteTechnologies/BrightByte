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
import { SpinnerService } from "../../core/spinner.service";

@Component({
    selector: "page-ranking",
    templateUrl: "ranking.html"
})
export class RankingPage {
    
    public userDetails = new UserDetails();
    public msg: string;
    public usersRep = new Array<UserReputation>();
    public numberUserList = AppConfig.N_USER_RANKING_LIST;
    public rankingTitle = ["Baby Coder", "Power Coder", "Ninja Coder", "Jedi coder", "Sith coder", "Squid Coder"];
    public userRankDetails: IUserRankDetails;
    public userRank = "No rank";
    public userLevel = 0;
    public userStars = 0;
    public userTrophy = ["t01-off.png", "t02-off.png", "t03-off.png", "t04-off.png", "t05-off.png", "t06-off.png"];
    private log: ILogger;
    private account: Account;


    constructor(
        public navCtrl: NavController,
        public loggerSrv: LoggerService,
        public translateService: TranslateService,
        public spinnerService: SpinnerService,
        private contractManagerService: ContractManagerService,
        private loginService: LoginService
    ) {
        this.log = loggerSrv.get("RankingPage");
        this.account = this.loginService.getAccount();
        this.log.d("Imported account: ", this.account);
        this.userRankDetails = new IUserRankDetails();
        this.refresh();
        
    }
    public refresh() {
        this.spinnerService.showLoader();
        this.log.d("Imported account: ", this.account);
        this.contractManagerService.getAllUserReputation()
            .then((usersRep: UserReputation[]) => {
                this.log.d("Users reputation obtained: ", usersRep);
                this.usersRep = usersRep.sort((a, b) => { return b.reputation - a.reputation; });
                this.usersRep.forEach(user => {
                    user.userPosition = this.usersRep.indexOf(user) + 1;
                    console.log(user.userHash);
                });
                this.log.d("Array of usersRep organized: ", this.usersRep);
                this.spinnerService.hideLoader();
                return;
            }).then(() => {
                console.log("SETTING USER..");
                this.setUser(this.account.address);
            }).catch((e) => {
                this.translateService.get("ranking.getReputation").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                        this.spinnerService.hideLoader();
                    });
            });
    }

    public setUser(hash: string){
        this.contractManagerService.getUserDetails(hash)
        .then((detailsUser: UserDetails) => {
            this.log.d("User data obtained: ", detailsUser);
            this.userRankDetails.name = detailsUser.name;
            this.userRankDetails.email = detailsUser.email;
            this.userRankDetails.reviews = detailsUser.numberCommitsReviewedByMe;
            this.userRankDetails.commits = detailsUser.numbermyCommitsPending;
            this.userRankDetails.agreed = detailsUser.agreedPercentage;
            this.userRankDetails.score = Math.round(detailsUser.reputation);
            this.userRankDetails.rank = this.rankingTitle[Math.round(detailsUser.reputation)];
            this.userRankDetails.level = Math.round(detailsUser.reputation);
            this.setUpTrophys();
        });
    }

    public setUpTrophys(){
        let commits = this.userRankDetails.commits;
        let reviews = this.userRankDetails.reviews;
        this.userTrophy = ["t01-off.png", "t02-off.png", "t03-off.png", "t04-off.png", "t05-off.png", "t06-off.png"];
        if (commits >= 10){
            this.userTrophy[0] = "t01-on.png";
        }
        if (commits >= 50){
            this.userTrophy[1] = "t02-on.png";
        }
        if (commits >= 100){
            this.userTrophy[2] = "t03-on.png";
        }
        if (reviews >= 10){
            this.userTrophy[3] = "t04-on.png";
        }
        if (reviews >= 50){
            this.userTrophy[4] = "t05-on.png";
        }
        if (reviews >= 100){
            this.userTrophy[5] = "t06-on.png";
        }

    }
}

export class IUserRankDetails {
    public name: string;
    public rank: string;
    public level: number;
    public email: string;
    public score: number;
    public reviews: number;
    public commits: number;
    public agreed: number;
    constructor(){
        this.name = "";
        this.rank = "";
        this.level = 0;
        this.email = "";
        this.score = 0;
        this.reviews = 0;
        this.commits = 0;
        this.agreed = 0;
    }

}  
