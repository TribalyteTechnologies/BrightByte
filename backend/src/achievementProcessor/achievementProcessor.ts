import { AchievementEventDto } from "src/dto/achievementEvent.dto";
import { Observable } from "rxjs";
import { UserDatabaseService } from "../services/user-database.service";

export abstract class AchievementProcessor {

    public achievementId: number;

    public constructor(
        achievementId: number,
        public userDBSrv: UserDatabaseService
    ) {
        this.achievementId = achievementId;
    }

    public abstract process(event: AchievementEventDto): Observable<number>;

    public isObtained(userHash: string): Observable<boolean> {
        return this.userDBSrv.hasAchievement(userHash, this.achievementId.toString());
    }
}
