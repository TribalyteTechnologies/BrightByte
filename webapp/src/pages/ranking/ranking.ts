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
import { Achievement } from "../../models/achievement.model";
import { AchievementService } from "../../core/achievement.service";
import { ErrorHandlerService } from "../../domain/error-handler.service";


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
    public globalSelected = false;
    public achievementsUnlocked = new Array<Achievement>();
    public isPageLoaded = false;
    private log: ILogger;
    private account: Account;
    private isBackendOnline = true;

    constructor(
        public navCtrl: NavController,
        private translateService: TranslateService,
        public loggerSrv: LoggerService,
        private contractManagerService: ContractManagerService,
        private loginService: LoginService,
        private achievementSrv: AchievementService,
        private errorHndlr: ErrorHandlerService
    ) {
        this.log = loggerSrv.get("RankingPage");
        this.account = this.loginService.getAccount();
        this.log.d("Imported account: ", this.account);
    }

    public ionViewWillEnter() {
        this.contractManagerService.getCurrentSeason()
            .then((season: number[]) => {
                this.numberOfSeasons = season[0];
                this.seasonFinale = season[1] * AppConfig.SECS_TO_MS;
                this.seasonSelected = season[0];
                setInterval(
                    () => {
                        let now = new Date().getTime();
                        let distance = this.seasonFinale - now;
                        this.days = Math.floor(distance / (AppConfig.SECS_TO_MS * AppConfig.DAY_TO_SECS));
                        this.hours = Math.floor((distance % (AppConfig.SECS_TO_MS * AppConfig.DAY_TO_SECS))
                            / (AppConfig.SECS_TO_MS * AppConfig.HOUR_TO_SECS));
                        this.minutes = Math.floor((distance % (AppConfig.SECS_TO_MS * AppConfig.HOUR_TO_SECS))
                            / (AppConfig.SECS_TO_MS * AppConfig.MIN_TO_SECS));
                        this.seconds = Math.floor((distance % (AppConfig.SECS_TO_MS * AppConfig.MIN_TO_SECS))
                            / AppConfig.SECS_TO_MS);
                    }, 
                    AppConfig.SECS_TO_MS);
                this.seasons.push("Ranking Global");
                for (let i = this.numberOfSeasons; i >= 0; i--) {
                    this.seasons.push("Season " + i);
                }
                this.refresh();
            });
    }

    public refresh() {
        this.contractManagerService.getAllUserReputation(this.seasonSelected, this.globalSelected)
            .then((usersRep: UserReputation[]) => {
                this.usersRep = usersRep.sort((a: UserReputation, b: UserReputation) =>
                    this.globalSelected ? b.engagementIndex - a.engagementIndex : b.reputation - a.reputation);
                if (!this.globalSelected) {
                    this.usersRep = this.usersRep.filter(user => user.finishedReviews > 0 || user.numberOfCommits > 0);
                }
                this.usersRep.forEach((user, i) => {
                    user.userPosition = ++i;
                });
                this.userHash = this.account.address;
            }).catch((e) => {
                this.translateService.get("ranking.getReputation").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
                throw e;
            });
        this.setUser(this.account.address);
    }

    public setUser(hash: string) {
        let detailsUser = this.usersRep.find(user => user.userHash === hash);
        if (detailsUser) {
            this.userRankDetails.name = detailsUser.name;
            this.userRankDetails.email = detailsUser.email;
            this.userRankDetails.reviews = detailsUser.finishedReviews;
            this.userRankDetails.commits = detailsUser.numberOfCommits;
            this.userRankDetails.agreed = detailsUser.agreedPercentage;
            this.userRankDetails.score = detailsUser.reputation;
            this.userRankDetails.rank = this.rankingTitle[Math.round(detailsUser.reputation)];
            this.userRankDetails.level = Math.round(detailsUser.reputation * 3);
            this.userRankDetails.engagementIndex = detailsUser.engagementIndex;
            this.userRankDetails.scoreString = (this.userRankDetails.score / AppConfig.REPUTATION_FACTOR).toFixed(2);
            this.userRankDetails.engagementIndexString = this.userRankDetails.engagementIndex.toFixed(2);
            this.setUpTrophys(hash);
        }
    }

    public goBackToUser() {
        this.setUser(this.account.address);
    }

    public setCurrentSeason() {
        this.globalSelected = false;
        this.seasonSelected = this.numberOfSeasons;
        this.comboSelected = this.seasons[1];
        this.refresh();
    }

    public getNumbersOfSeason() {
        this.contractManagerService.getCurrentSeason()
            .then((season: number[]) => {
                this.numberOfSeasons = season[0];
                this.seasonFinale = season[1] * AppConfig.SECS_TO_MS;
                let date = new Date(this.seasonFinale);
                this.log.d("The current season is the number: " + this.numberOfSeasons + ", that ends the" + date);
            }).catch((e) => {
                this.translateService.get("ranking.getSeasonNumbers").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
            });
    }

    public setSeason(ind: string) {
        this.log.d("Change in the ranking");
        this.getNumbersOfSeason();
        this.log.d("The user has chosen the " + ind);
        this.globalSelected = (ind === this.seasons[0]);
        if (!this.globalSelected) {
            let season = this.parseInt(ind);
            this.globalSelected = false;
            this.seasonSelected = season;
        }
        this.comboSelected = ind;
        this.refresh();
    }

    private setUpTrophys(userHash: string) {
        this.achievementsUnlocked = new Array<Achievement>();
        this.log.d(userHash);
        this.isPageLoaded = false;
        if (this.isBackendOnline) {
            this.achievementSrv.getCurrentUnlockedAchievements(userHash).subscribe(
                response => {
                    this.achievementsUnlocked = response;
                    this.isPageLoaded = true;
                },
                error => {
                    this.translateService.get("errors.backendOffline")
                        .subscribe(msg => this.errorHndlr.showUserAlert(msg));
                    this.isBackendOnline = false;
                });
        }
    }

    private parseInt(ind: string): number {
        return +ind.match(/\d+/)[0];
    }
}

