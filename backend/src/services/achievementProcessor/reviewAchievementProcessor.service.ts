import { Injectable } from "@nestjs/common";
import { ReviewEventDto } from "../../dto/reviewEvent.dto";
import { AchievementProcessorService } from "./achievementProcessor.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BackendConfig } from "src/backend.config";

@Injectable()
export class ReviewAchievementProcessorService extends AchievementProcessorService {

    private countGoal: number;


    public constructor(achievementId: number, countGoal: number) {
        super(achievementId);
        this.countGoal = countGoal;
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
