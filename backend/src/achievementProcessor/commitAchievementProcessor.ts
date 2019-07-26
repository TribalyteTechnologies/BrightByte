import { CommitEventDto } from "../dto/commitEvent.dto";
import { AchievementProcessor } from "./achievementProcessor";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BackendConfig } from "src/backend.config";
import { UserDatabaseService } from "../services/user-database.service";

export class CommitAchievementProcessor extends AchievementProcessor {

    private countGoal: number;


    public constructor(achievementId: number, countGoal: number, userDBSrv: UserDatabaseService) {
        super(achievementId, userDBSrv);
        this.countGoal = countGoal;
    }

    public process(event: CommitEventDto): Observable<number> {
        return this.isObtained(event.userHash).pipe(map(response => {
            let obtainedAchievement = null;
            if (!response && event.count >= this.countGoal && event.eventType === BackendConfig.EventTypeEnum.Commit) {
                obtainedAchievement = this.achievementId;
            }
            return obtainedAchievement;
        }));
    }
}
