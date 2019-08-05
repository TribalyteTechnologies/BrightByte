import { ReviewEventDto } from "../dto/review-event.dto";
import { AchievementProcessor } from "./achievement-processor";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BackendConfig } from "../backend.config";
import { UserDatabaseService } from "../services/user-database.service";
import { AchievementConfig } from "src/achievement.config";

export class ReviewAchievementProcessor extends AchievementProcessor {

    private countGoal: number;

    public constructor(
        achievementId: number,
        userDbSrv: UserDatabaseService
    ) {
        super(achievementId, userDbSrv);
        let achievementDto = AchievementConfig.achievements.get(achievementId);
        this.countGoal = parseInt(achievementDto.parameter);
    }

    public process(event: ReviewEventDto): Observable<number> {
        return this.isObtained(event.userHash).pipe(map(response => {
            let obtainedAchievement = null;
            if (!response.data && event.count >= this.countGoal && event.eventType === BackendConfig.EventTypeEnum.Review) {
                obtainedAchievement = this.achievementId;
            }
            return obtainedAchievement;
        }));
    }
}
