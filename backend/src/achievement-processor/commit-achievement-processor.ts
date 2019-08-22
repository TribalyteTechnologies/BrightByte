import { CommitEventDto } from "../dto/events/commit-event.dto";
import { AchievementProcessor } from "./achievement-processor";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BackendConfig } from "../backend.config";
import { UserDatabaseService } from "../services/user-database.service";
import { AchievementDto } from "../dto/achievement.dto";

export class CommitAchievementProcessor extends AchievementProcessor {

    private countGoal: number;

    public constructor(
        achievement: AchievementDto,
        userDbSrv: UserDatabaseService
    ) {
        super(achievement, userDbSrv);
        this.countGoal = achievement.values[0];
    }

    public process(event: CommitEventDto): Observable<AchievementDto> {
        return this.isObtained(event.userHash).pipe(map(response => {
            let obtainedAchievement = null;
            if (response
                && (response.status === BackendConfig.STATUS_FAILURE
                    || (response.status === BackendConfig.STATUS_SUCCESS && response.data === false))
                && event.count >= this.countGoal
                && event.eventType === BackendConfig.EventTypeEnum.Commit) {
                obtainedAchievement = this.achievement;
            }
            return obtainedAchievement;
        }));
    }
}
