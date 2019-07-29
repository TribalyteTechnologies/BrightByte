import { Injectable } from "@nestjs/common";
import { CommitAchievementProcessor } from "../achievement-processor/commitAchievementProcessor";
import { ReviewAchievementProcessor } from "../achievement-processor/reviewAchievementProcessor";
import { AchievementProcessor } from "../achievement-processor/achievementProcessor";
import { ILogger, LoggerService } from "../logger/logger.service";
import { AchievementEventDto } from "../dto/achievement-event.dto";
import { EventDatabaseService } from "./event-database.service";
import { UserDatabaseService } from "../services/user-database.service";

@Injectable()
export class DispatcherService {

    private achievementStack = new Array<AchievementProcessor>();
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private eventDBSrv: EventDatabaseService,
        private userDBSrv: UserDatabaseService
    ) {
        this.log = loggerSrv.get("DispatcherService");
        this.init();
    }

    public dispatch(event: AchievementEventDto) {
        this.log.d("New event recieved:", event);
        this.eventDBSrv.setEvent(event).subscribe(res => this.log.d("Event saved"));
        this.achievementStack.forEach(achievementProcessor => {
            achievementProcessor.process(event).subscribe(achievementId => {
                if (achievementId) {
                    this.userDBSrv.setObtainedAchievement(event.userHash, achievementId.toString())
                        .subscribe(res => this.log.d("Achievement saved"));
                }
            });
        });

        //TODO: NotifyFrontService stack new achievements notifications.
        //TODO: ClientMsgHandler send new achievements to client.
    }

    private init() {
        this.achievementStack = [new CommitAchievementProcessor(1, 1, this.userDBSrv),
        new CommitAchievementProcessor(2, 10, this.userDBSrv), new CommitAchievementProcessor(3, 50, this.userDBSrv),
        new CommitAchievementProcessor(4, 78, this.userDBSrv), new CommitAchievementProcessor(5, 250, this.userDBSrv),
        new ReviewAchievementProcessor(6, 1, this.userDBSrv), new ReviewAchievementProcessor(7, 9, this.userDBSrv),
        new ReviewAchievementProcessor(8, 50, this.userDBSrv), new ReviewAchievementProcessor(9, 100, this.userDBSrv),
        new ReviewAchievementProcessor(10, 250, this.userDBSrv)];
    }
}
