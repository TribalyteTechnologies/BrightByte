import { AchievementEventDto } from "../dto/achievement-event.dto";
import { Observable } from "rxjs";
import { UserDatabaseService } from "../services/user-database.service";

export abstract class AchievementProcessor {

    protected achievementId: number;

    public constructor(
        achievementId: number,
        public userDbSrv: UserDatabaseService
    ) {
        this.achievementId = achievementId;
    }

    public abstract process(event: AchievementEventDto): Observable<number>;

    public isObtained(userHash: string): Observable<boolean> {
        return this.userDbSrv.hasAchievement(userHash, this.achievementId.toString());
    }
}
