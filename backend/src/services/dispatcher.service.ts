import { Injectable } from "@nestjs/common";
import { AchievementProcessor } from "../achievement-processor/achievement-processor";
import { ILogger, LoggerService } from "../logger/logger.service";
import { AchievementEventDto } from "../dto/events/achievement-event.dto";
import { EventDatabaseService } from "./event-database.service";
import { UserDatabaseService } from "../services/user-database.service";
import { ClientNotificationService } from "./client-notfication.service";
import { filter, map, flatMap, tap } from "rxjs/operators";
import { Observable, from, combineLatest } from "rxjs";
import { BackendConfig } from "../backend.config";
import { AchievementDatabaseService } from "./achievement-database.service";
import { CommitAchievementProcessor } from "../achievement-processor/commit-achievement-processor";
import { ReviewAchievementProcessor } from "../achievement-processor/review-achievement-processor";
import { TimedReviewAchievementProcessor } from "../achievement-processor/timed-review-achievement-processor";

@Injectable()
export class DispatcherService {

    private achievementStack: Array<AchievementProcessor>;
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
        this.eventDbSrv.setEvent(event).pipe(
            flatMap(res => this.userDbSrv.createUser(event.userHash)),
            flatMap(res => {
                return this.achievementStack.map(achievementProcessor => {
                    return achievementProcessor.process(event);
                });
            }),
            flatMap(obs => combineLatest(obs)),
            map(achievements => achievements.filter(value => !!value)),
            tap(obtainedAchievements => {
                obtainedAchievements.forEach(achievement => {
                    this.userDbSrv.setObtainedAchievement(event.userHash, achievement.id).subscribe(response => {
                        if (response.status === BackendConfig.STATUS_SUCCESS) {
                            this.log.d("Achievement saved for ", event.userHash, ": ", achievement);
                        } else {
                            this.log.w("Couldn't save achievement for ", event.userHash, ": ", achievement);
                        }
                    });
                });
            }),
            map(obtainedAchievements => {
                if (obtainedAchievements.length > 0) {
                    this.clientNtSrv.sendNewAchievement(event.userHash, obtainedAchievements);
                }
            })
        ).subscribe();
        //TODO: NotifyFrontService stack new achievements notifications.
    }

    private init() {
        this.achievementStack = new Array<AchievementProcessor>();
        this.achievementDbSrv.getAchievementMap().subscribe(mapAchievements => {
            mapAchievements.forEach((achievement) => {
                this.log.d(achievement);
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
                    default:
                        this.log.d("Error, type " + achievement.processorType);
                }
                this.achievementStack.push(processor);
            });
        });
    }
}
