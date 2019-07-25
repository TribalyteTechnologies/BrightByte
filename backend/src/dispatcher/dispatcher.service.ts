import { Injectable, HttpService } from "@nestjs/common";
import { CommitAchievementProcessorService } from "src/services/achievementProcessor/commitAchievementProcessor.service";
import { ReviewAchievementProcessorService } from "src/services/achievementProcessor/reviewAchievementProcessor.service";
import { AchievementProcessorService } from "src/services/achievementProcessor/achievementProcessor.service";
import { ILogger, LoggerService } from "../logger/logger.service";
import { BackendConfig } from "src/backend.config";
import { AchievementEventDto } from "src/dto/achievementEvent.dto";

@Injectable()
export class DispatcherService {

    private achievementStack = Array<AchievementProcessorService>();
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private httpService: HttpService
    ) {
        this.log = loggerSrv.get("DispatcherService");
        this.init();
    }

    public init() {
        this.achievementStack = [new CommitAchievementProcessorService(1, 1), new CommitAchievementProcessorService(2, 10),
        new CommitAchievementProcessorService(3, 50), new CommitAchievementProcessorService(4, 100), 
        new CommitAchievementProcessorService(5, 250), new ReviewAchievementProcessorService(6, 1), 
        new ReviewAchievementProcessorService(7, 10), new ReviewAchievementProcessorService(8, 50), 
        new ReviewAchievementProcessorService(9, 100), new ReviewAchievementProcessorService(10, 250)];
    }

    public dispatch(event: AchievementEventDto) {
        this.log.w(event);
        this.achievementStack.forEach(achievementProcessor => {
            achievementProcessor.process(event).subscribe(achievementId => {
                if (achievementId) {
                    this.httpService.post(BackendConfig.SET_OBTAINED_ACHIEVEMENTS + event.userHash + "/" + achievementId
                    ).subscribe(res => this.log.w(res.data));
                }
            });
        });

        //TODO: NotifyFrontService stack new achievements notifications.
        //TODO: ClientMsgHandler send new achievements to client.
    }
}
