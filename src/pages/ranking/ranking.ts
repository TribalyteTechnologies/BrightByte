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

class UserRankDetails {
    public name = "";
    public rank = "";
    public level = 0;
    public email = "";
    public score = 0;
    public reviews = 0;
    public commits = 0;
    public agreed = 0;
    public engagementIndex = 0;
    public scoreString = "";
    public engagementIndexString = "";
}  

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
    public userRankDetails = new UserRankDetails();
    public userRank = "No rank";
    public userLevel = 0;
    public userStars = 0;
    public userHash = "";
    public userTrophyList = new Array<string>();
    public numberOfSeasons = 0;
    public seasonSelected = 0;
    public comboSelected = "";
    public seasonFinale = 0;
    public seasons = new Array<string>();
    public days: number;
    public hours: number;
    public minutes: number;
    public seconds: number;
    public globalSelected = true;
    private log: ILogger;
    private account: Account;

    constructor(
        public navCtrl: NavController,
        private translateService: TranslateService,
        public loggerSrv: LoggerService,
        private contractManagerService: ContractManagerService,
        private loginService: LoginService
    ) {
        this.log = loggerSrv.get("RankingPage");
        this.account = this.loginService.getAccount();
        this.log.d("Imported account: ", this.account);
        this.contractManagerService.getCurrentSeason()
        .then((season: number[]) => {
            this.numberOfSeasons = season[0];
            this.seasonFinale = season[1] * 1000;
            setInterval(() => {
                let now = new Date().getTime();
                let distance = this.seasonFinale - now;
                this.days = Math.floor(distance / (1000 * 60 * 60 * 24));
                this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                this.seconds = Math.floor((distance % (1000 * 60)) / 1000);
            },          1000);
            this.seasons.push("Ranking Global");
            for(let i = this.numberOfSeasons; i >= 0; i--) {
                this.seasons.push("Season " + i); 
            }
        });
    }

    public ionViewWillEnter(){
        this.refresh();
    }

    public refresh() {
        this.contractManagerService.getAllUserReputationSeason(this.seasonSelected, this.globalSelected)
        .then((usersRep: UserReputation[]) => {
            this.usersRep = usersRep.sort((a: UserReputation, b: UserReputation) => 
                this.globalSelected ? b.engagementIndex - a.engagementIndex : b.reputation - a.reputation);
            this.usersRep.forEach(user => {
                user.userPosition = this.usersRep.indexOf(user) + 1;
            });
            return;
        }).then(() => {
            this.userHash = this.account.address;
            this.setUser(this.account.address);
        }).catch((e) => {
            this.translateService.get("ranking.getReputation").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                });
        });        
    }

    public setUser(hash: string){
        let detailsUser = this.usersRep.find(user => user.userHash === hash);
        this.userRankDetails.name = detailsUser.name;
        this.userRankDetails.email = detailsUser.email;
        this.userRankDetails.reviews = detailsUser.finishedReviews;
        this.userRankDetails.commits = detailsUser.numberOfCommits;
        this.userRankDetails.agreed = detailsUser.agreedPercentage;
        this.userRankDetails.score = detailsUser.reputation;
        this.userRankDetails.rank = this.rankingTitle[Math.round(detailsUser.reputation)];
        this.userRankDetails.level = Math.round(detailsUser.reputation * 3);
        this.userRankDetails.engagementIndex = detailsUser.engagementIndex;
        this.userRankDetails.scoreString = this.userRankDetails.score.toFixed(2);
        this.userRankDetails.engagementIndexString = this.userRankDetails.engagementIndex.toFixed(2);
        this.setUpTrophys();
    }

    public goBackToUser(){
        this.setUser(this.account.address);
    }

    public setCurrentSeason() {
        this.globalSelected = false;
        this.seasonSelected = this.numberOfSeasons;
        this.comboSelected = this.seasons[1];
        this.refresh();
    }

    public getNumbersOfSeason(){
        this.contractManagerService.getCurrentSeason()
        .then((season: number[]) => {
            this.numberOfSeasons = season[0];
            this.seasonFinale = season[1] * 1000;
            let date = new Date(this.seasonFinale * 1000);
            this.log.d("The current season is the number: " + this.numberOfSeasons + ", that ends the" + date);
        }).catch((e) => {
            this.translateService.get("ranking.getSeasonNumbers").subscribe(
                msg => {
                    this.msg = msg;
                    this.log.e(msg, e);
                });
        });
    }

    public setSeason(ind: string){
        this.log.d("Change in the ranking");
        this.getNumbersOfSeason();
        this.log.d("The user has chosen the " + ind);
        if(ind === this.seasons[0]) {            
            this.globalSelected = true;
        } else {
            let season = +ind.match(/\d+/)[0];
            this.globalSelected = false;
            this.seasonSelected = season;
        }
        this.comboSelected = ind;
        this.refresh();
    }

    private setUpTrophys(){
        let commits = this.userRankDetails.commits;
        let reviews = this.userRankDetails.reviews;
        this.userTrophyList = ["t01-off.png", "t02-off.png", "t03-off.png", "t04-off.png", "t05-off.png", "t06-off.png"];
        if (commits >= 10){
            this.userTrophyList[0] = "t01-on.png";
        }
        if (commits >= 50){
            this.userTrophyList[1] = "t02-on.png";
        }
        if (commits >= 100){
            this.userTrophyList[2] = "t03-on.png";
        }
        if (reviews >= 10){
            this.userTrophyList[3] = "t04-on.png";
        }
        if (reviews >= 50){
            this.userTrophyList[4] = "t05-on.png";
        }
        if (reviews >= 100){
            this.userTrophyList[5] = "t06-on.png";
        }

    }
}

