import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { LoginService } from "../../core/login.service";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { Account } from "web3/types";
import { UserReputation } from "../../models/user-reputation.model";
import { AppConfig } from "../../app.config";
import { Achievement } from "../../models/achievement.model";
import { AchievementService } from "../../domain/achievement.service";
import { ErrorHandlerService } from "../../domain/error-handler.service";
import { AvatarService } from "../../domain/avatar.service";
import { Observable } from "rxjs";


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
    public hash = "";
    public isRanked = true;
}

@Component({
    selector: "page-ranking",
    templateUrl: "ranking.html"
})
export class RankingPage {

    public static readonly minNumberReview = AppConfig.MIN_REVIEW_QUALIFY;
    public static readonly minNumberCommit = AppConfig.MIN_COMMIT_QUALIFY;
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
    public seasonEnded = false;
    public globalSelected = false;
    public achievementsUnlocked = new Array<Achievement>();
    public isPageLoaded = false;
    public currentUserObs: Observable<string>;
    public tooltipParams: { pendingCommits: number; pendingReviews: number; agreedPercentage: number};
    public commitParams: { numCommits: number; minNumberCommit: number; };
    public reviewParams: { numReviews: number; minNumberReview: number; };
    private log: ILogger;
    private account: Account;
    private isBackendOnline = true;
    private showDetails = false;

    constructor(
        public navCtrl: NavController,
        private translateService: TranslateService,
        public loggerSrv: LoggerService,
        private contractManagerService: ContractManagerService,
        private loginService: LoginService,
        private achievementSrv: AchievementService,
        private errorHndlr: ErrorHandlerService,
        private avatarSrv: AvatarService
    ) {
        this.log = loggerSrv.get("RankingPage");
        this.account = this.loginService.getAccount();
        this.log.d("Imported account: ", this.account);
    }

    public ionViewWillEnter() {
        this.contractManagerService.getCurrentSeason()
            .then((season: number[]) => {
                this.numberOfSeasons = Number(season[0]);
                this.seasonSelected = this.numberOfSeasons;
                this.seasonFinale = season[1] * AppConfig.SECS_TO_MS;
                setInterval(
                    () => {
                        let now = new Date().getTime();
                        let distance = this.seasonFinale - now;
                        this.seasonEnded = distance < 0;
                        this.days = Math.floor(distance / (AppConfig.SECS_TO_MS * AppConfig.DAY_TO_SECS));
                        this.hours = Math.floor((distance % (AppConfig.SECS_TO_MS * AppConfig.DAY_TO_SECS))
                            / (AppConfig.SECS_TO_MS * AppConfig.HOUR_TO_SECS));
                        this.minutes = Math.floor((distance % (AppConfig.SECS_TO_MS * AppConfig.HOUR_TO_SECS))
                            / (AppConfig.SECS_TO_MS * AppConfig.MIN_TO_SECS));
                        this.seconds = Math.floor((distance % (AppConfig.SECS_TO_MS * AppConfig.MIN_TO_SECS))
                            / AppConfig.SECS_TO_MS);
                    },
                    AppConfig.SECS_TO_MS);
                this.seasons.push(this.translateService.instant("ranking.global"));
                for (let i = this.numberOfSeasons; i >= 0; i--) {
                    this.seasons.push("Season " + i);
                }
                this.refresh();
            });
    }

    public refresh() {
        this.contractManagerService.getAllUserReputation(this.seasonSelected, this.globalSelected)
            .then((usersRep: UserReputation[]) => {
                usersRep = usersRep
                .map(user => {
                    user.reputation = Math.round(user.reputation / 10) * 10;
                    return user;
                });

                this.usersRep = usersRep.sort((a: UserReputation, b: UserReputation) => {
                    let ret: number;
                    if(this.globalSelected) {
                        ret = b.engagementIndex - a.engagementIndex;
                    } else {
                        ret = (b.reputation - a.reputation) || 
                            (b.engagementIndex - a.engagementIndex);
                    }
                    return ret;
                });
                if (!this.globalSelected) {
                    this.usersRep = this.usersRep.filter(user => user.numberReviewsMade > 0 || user.numberCommitsMade > 0);
                    let rankedUsers = this.usersRep.filter(user => this.isRankedUser(user));
                    let unRankedUsers = this.usersRep.filter(user => !this.isRankedUser(user));
                    unRankedUsers = unRankedUsers.sort((a: UserReputation, b: UserReputation) => {
                        return (b.numberCommitsMade + b.numberReviewsMade) - (a.numberCommitsMade + a.numberReviewsMade);
                    });
                    if (this.seasonSelected >= AppConfig.FIRST_QUALIFYING_SEASON) {
                        unRankedUsers.forEach(user => user.isRanked = false);
                    }
                    this.usersRep = rankedUsers.concat(unRankedUsers);
                }

                this.usersRep.forEach((user, i) => {
                    user.userPosition = ++i;
                });
                this.userHash = this.account.address;
                this.setUser(this.account.address);
            }).catch((e) => {
                this.translateService.get("ranking.getReputation").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    });
                throw e;
            });
    }

    public setUser(hash: string) {
        let userSearch = this.usersRep.filter(user => user.userHash === hash);
        let userDetails = userSearch[0];
        this.showDetails = this.usersRep.length > 0;
        userDetails = (!userDetails && this.showDetails) ? this.usersRep[0] : userDetails;
        if (userDetails) {
            this.userRankDetails.name = userDetails.name;
            this.userRankDetails.email = userDetails.email;
            this.userRankDetails.reviews = userDetails.numberReviewsMade;
            this.userRankDetails.commits = userDetails.numberCommitsMade;
            this.userRankDetails.agreed = userDetails.agreedPercentage;
            this.userRankDetails.score = userDetails.reputation;
            this.userRankDetails.rank = this.rankingTitle[Math.round(userDetails.reputation)];
            this.userRankDetails.level = Math.round(userDetails.reputation * 3);
            this.userRankDetails.engagementIndex = userDetails.engagementIndex;
            this.userRankDetails.scoreString = (Math.floor(this.userRankDetails.score * 100 / AppConfig.REPUTATION_DIVISION_FACTOR) / 100)
                                                .toFixed(2);
            this.userRankDetails.engagementIndexString = this.userRankDetails.engagementIndex.toFixed(2);
            this.userRankDetails.hash = userDetails.userHash;
            this.userRankDetails.isRanked = userDetails.isRanked;
            this.currentUserObs = this.avatarSrv.getAvatarObs(userDetails.userHash);
            this.setUpTrophys(userDetails.userHash);
            this.tooltipParams = {
                pendingCommits: Math.max(0, RankingPage.minNumberCommit - this.userRankDetails.commits),
                pendingReviews: Math.max(0, RankingPage.minNumberReview - this.userRankDetails.reviews),
                agreedPercentage: userDetails.agreedPercentage
            };
            this.commitParams = {
                numCommits: this.userRankDetails.commits,
                minNumberCommit : RankingPage.minNumberCommit 
            };
            this.reviewParams = {
                numReviews: this.userRankDetails.reviews,
                minNumberReview : RankingPage.minNumberReview
            };
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
                this.numberOfSeasons = Number(season[0]);
                this.seasonFinale = season[1] * AppConfig.SECS_TO_MS;
                this.seasonEnded = (this.seasonFinale - new Date().getTime()) < 0;
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

    private isRankedUser(user: UserReputation): boolean {
        return user.numberCommitsMade >= AppConfig.MIN_COMMIT_QUALIFY && user.numberReviewsMade >= AppConfig.MIN_REVIEW_QUALIFY;
    }
}
