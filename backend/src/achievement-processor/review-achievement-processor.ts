import { ReviewEventDto } from "../dto/events/review-event.dto";
import { AchievementProcessor } from "./achievement-processor";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BackendConfig } from "../backend.config";
import { UserDatabaseService } from "../services/user-database.service";
import { AchievementDto } from "../dto/achievement.dto";
import { DispatcherService } from "../services/dispatcher.service";

export class ReviewAchievementProcessor extends AchievementProcessor {

    private countGoal: number;

    public constructor(
        achievement: AchievementDto,
        userDbSrv: UserDatabaseService
    ) {
        super(achievement, userDbSrv);
        this.countGoal = achievement.values[0];
    }

    public process(event: ReviewEventDto): Observable<AchievementDto> {
        return this.isAchievementObtained(event.userHash).pipe(map(response => {
            let obtainedAchievement = null;
            if (response
                && (response.status === BackendConfig.STATUS_SUCCESS && response.data === false)
                && event.count >= this.countGoal
                && event.eventType === BackendConfig.EventTypeEnum.Review) {
                obtainedAchievement = this.achievement;
            }
            return obtainedAchievement;
        }));
    }
}

