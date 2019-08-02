import { Injectable } from "@nestjs/common";
import { CommitAchievementProcessor } from "../achievement-processor/commit-achievement-processor";
import { ReviewAchievementProcessor } from "../achievement-processor/review-achievement-processor";
import { AchievementProcessor } from "../achievement-processor/achievement-processor";
import { ILogger, LoggerService } from "../logger/logger.service";
import { AchievementEventDto } from "../dto/achievement-event.dto";
import { EventDatabaseService } from "./event-database.service";
import { UserDatabaseService } from "../services/user-database.service";
import { ClientNotificationService } from "./client-notfication.service";
import { filter, map, flatMap } from "rxjs/operators";
import { Observable, from, combineLatest } from "rxjs";

@Injectable()
export class DispatcherService {

    private achievementStack = new Array<AchievementProcessor>();
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private eventDbSrv: EventDatabaseService,
        private userDbSrv: UserDatabaseService,
        private clientNtSrv: ClientNotificationService
    ) {
        this.log = loggerSrv.get("DispatcherService");
        this.init();
    }

    public dispatch(event: AchievementEventDto) {
        this.log.d("New event received:", event);
        this.eventDbSrv.setEvent(event).subscribe(res => this.log.d("Event saved"));
        let observables = this.achievementStack.map(achievementProcessor => {
            return achievementProcessor.process(event);
        });
        
        combineLatest(observables)
            .subscribe((achievementIds => {
                let obtainedAchievements = achievementIds.filter(value => value);
                this.log.d("array", obtainedAchievements);
                let achievementsObs;
                achievementsObs = this.userDbSrv.setObtainedAchievement(
                    event.userHash, obtainedAchievements.toString()).subscribe(response => {
                    this.log.d("Achievements saved");
                    this.clientNtSrv.sendNewAchievement(event.userHash, obtainedAchievements);
                    this.log.d("Achievements sended to client");
                });
            }));
        //TODO: NotifyFrontService stack new achievements notifications.
    }

    private init() {
        this.achievementStack = [new CommitAchievementProcessor(1, 1, this.userDbSrv),
        new CommitAchievementProcessor(2, 10, this.userDbSrv), new CommitAchievementProcessor(3, 50, this.userDbSrv),
        new CommitAchievementProcessor(4, 78, this.userDbSrv), new CommitAchievementProcessor(5, 250, this.userDbSrv),
        new ReviewAchievementProcessor(6, 1, this.userDbSrv), new ReviewAchievementProcessor(7, 6, this.userDbSrv),
        new ReviewAchievementProcessor(8, 15, this.userDbSrv), new ReviewAchievementProcessor(9, 100, this.userDbSrv),
        new ReviewAchievementProcessor(10, 250, this.userDbSrv)];
    }
}
