import { AchievementProcessor } from "./achievement-processor";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BackendConfig } from "../backend.config";
import { UserDatabaseService } from "../services/user-database.service";
import { ReviewEventDto } from "../dto/events/review-event.dto";
import { AchievementDto } from "../dto/achievement.dto";
import { GlobalConstants } from "../global.constants";
import { DispatcherService } from "../services/dispatcher.service";
import { ILogger, LoggerService } from "../logger/logger.service";

export class TimedReviewAchievementProcessor extends AchievementProcessor {

    private countGoal: number;
    private timeGoal: number;
    private eventQueues: Map<string, Array<ReviewEventDto>>;

    public constructor(
        achievement: AchievementDto,
        userDbSrv: UserDatabaseService
    ) {
        super(achievement, userDbSrv);
        this.countGoal = achievement.values[0];
        this.timeGoal = achievement.values[1] * GlobalConstants.SECONDS_TO_MS;
        this.eventQueues = new Map<string, Array<ReviewEventDto>>();
    }

    public process(event: ReviewEventDto): Observable<AchievementDto> {
        return this.isAchievementObtained(event.userHash, event.teamUid).pipe(
            map(response => {
                let obtainedAchievement = null;
                if (response
                    && (response.status === BackendConfig.STATUS_SUCCESS && response.data === false)
                    && event.eventType === BackendConfig.EventTypeEnum.Review) {
                    if (!this.eventQueues[event.userHash]) {
                        this.eventQueues[event.userHash] = new Array<ReviewEventDto>();
                    } else {
                        let queue = this.eventQueues[event.userHash];
                        queue.push(event);
                        if (queue.length >= this.countGoal
                            && queue[this.countGoal - 1].timestamp - queue[0].timestamp <= this.timeGoal) {
                            obtainedAchievement = this.achievement;
                        }
                        if (queue.length >= this.countGoal) {
                            queue.shift();
                        }
                    }
                }
                return obtainedAchievement;
            }));
    }
}
