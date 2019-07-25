import { Injectable, HttpService } from "@nestjs/common";
import { CommitAchievementProcessorService } from "src/services/achievementProcessor/commitAchievementProcessor.service";
import { AchievementProcessorService } from "src/services/achievementProcessor/achievementProcessor.service";
import { ILogger, LoggerService } from "../logger/logger.service";
import { BackendConfig } from "src/backend.config";
import { CommitEventDto } from "src/dto/commitEvent.dto";

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
        new CommitAchievementProcessorService(3, 50)];
    }

    public dispatch(event: CommitEventDto) {
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
