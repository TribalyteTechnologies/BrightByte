import { AchievementEventDto } from "../dto/events/achievement-event.dto";
import { Observable } from "rxjs";
import { UserDatabaseService } from "../services/user-database.service";
import { ResponseDto } from "../dto/response/response.dto";
import { AchievementDto } from "../dto/achievement.dto";

export abstract class AchievementProcessor {

    protected achievement: AchievementDto;

    public constructor(
        achievement: AchievementDto,
        public userDbSrv: UserDatabaseService
    ) {
        this.achievement = achievement;
    }

    public abstract process(event: AchievementEventDto): Observable<AchievementDto>;

    public isAchievementObtained(userHash: string): Observable<ResponseDto> {
        return this.userDbSrv.hasAchievement(userHash, this.achievement.id);
    }
}
