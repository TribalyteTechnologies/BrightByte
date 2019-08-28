import { AchievementProcessor } from "./achievement-processor";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BackendConfig } from "../backend.config";
import { UserDatabaseService } from "../services/user-database.service";
import { ReviewEventDto } from "src/dto/events/review-event.dto";
import { AchievementDto } from "src/dto/achievement.dto";
import { GlobalConstants } from "../global.constants";
import { DispatcherService } from "../services/dispatcher.service";

export class TimedReviewAchievementProcessor extends AchievementProcessor {

    private countGoal: number;
    private timeGoal: number;
    private eventQueue: Array<ReviewEventDto>;

    public constructor(
        achievement: AchievementDto,
        userDbSrv: UserDatabaseService
    ) {
        super(achievement, userDbSrv);
        this.countGoal = achievement.values[0];
        this.timeGoal = achievement.values[1] * GlobalConstants.SECONDS_TO_MS;
        this.eventQueue = new Array<ReviewEventDto>();
    }

    public process(event: ReviewEventDto): Observable<AchievementDto> {
        return this.isAchievementObtained(event.userHash).pipe(
            map(response => {
                let obtainedAchievement = null;
                if (response
                    && (response.status === BackendConfig.STATUS_SUCCESS && response.data === false)
                    && event.eventType === BackendConfig.EventTypeEnum.Review) {
                    this.eventQueue.push(event);
                    if (this.eventQueue.length >= this.countGoal
                        && this.eventQueue[this.countGoal - 1].timestamp - this.eventQueue[0].timestamp <= this.timeGoal) {
                        obtainedAchievement = this.achievement;
                    }
                    if (this.eventQueue.length >= this.countGoal) {
                        this.eventQueue.shift();
                    }
                }
                return obtainedAchievement;
            }));
    }
}
