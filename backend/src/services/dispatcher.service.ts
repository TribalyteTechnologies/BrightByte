import { Injectable } from "@nestjs/common";
import { CommitAchievementProcessor } from "../achievement-processor/commit-achievement-processor";
import { ReviewAchievementProcessor } from "../achievement-processor/review-achievement-processor";
import { AchievementProcessor } from "../achievement-processor/achievement-processor";
import { ILogger, LoggerService } from "../logger/logger.service";
import { AchievementEventDto } from "../dto/events/achievement-event.dto";
import { EventDatabaseService } from "./event-database.service";
import { UserDatabaseService } from "../services/user-database.service";
import { ClientNotificationService } from "./client-notfication.service";
import { filter, map, flatMap } from "rxjs/operators";
import { Observable, from, combineLatest } from "rxjs";
import { TimedReviewAchievementProcessor } from "src/achievement-processor/timed-review-achievement-processor";
import { BackendConfig } from "src/backend.config";
import { SeasonAchievementProcessor } from "src/achievement-processor/season-achievement.processor";
import { AchievementDatabaseService } from "./achievement-database.service";

@Injectable()
export class DispatcherService {

    private achievementStack = new Array<AchievementProcessor>();
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private eventDbSrv: EventDatabaseService,
        private userDbSrv: UserDatabaseService,
        private achievementDbSrv: AchievementDatabaseService,
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
            .subscribe(achievements => {
                let obtainedAchievements = achievements.filter(value => value);
                this.log.d("Obtained achievements:", obtainedAchievements);
                if (obtainedAchievements.length > 0) {
                    let achievementsObs = obtainedAchievements.map(achievement => {
                        return this.userDbSrv.setObtainedAchievement(event.userHash, achievement.title);
                    });
                    combineLatest(achievementsObs)
                        .subscribe(response => {
                            this.log.d("Achievements saved");
                            this.clientNtSrv.sendNewAchievement(event.userHash, obtainedAchievements);
                            this.log.d("Achievements sent to client");
                        });
                }
            });
        //TODO: NotifyFrontService stack new achievements notifications.
    }

    private init() {
        this.achievementDbSrv.initObs.subscribe(mapAchievements => {
            mapAchievements.forEach((achievement) => {
                let processor: AchievementProcessor;
                switch (achievement.processorType) {
                    case BackendConfig.AchievementTypeEnum.Commit:
                        processor = new CommitAchievementProcessor(achievement, this.userDbSrv);
                        break;
                    case BackendConfig.AchievementTypeEnum.Review:
                        processor = new ReviewAchievementProcessor(achievement, this.userDbSrv);
                        break;
                    case BackendConfig.AchievementTypeEnum.TimedReview:
                        processor = new TimedReviewAchievementProcessor(achievement, this.userDbSrv);
                        break;
                    case BackendConfig.AchievementTypeEnum.Season:
                        processor = new SeasonAchievementProcessor(achievement, this.userDbSrv);
                        break;
                    default:
                }
                this.achievementStack.push(processor);
            });
        });
    }
}

