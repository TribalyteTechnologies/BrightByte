import { Injectable } from "@nestjs/common";
import { CommitEventDto } from "../../dto/commitEvent.dto";
import { AchievementProcessorService } from "./achievementProcessor.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class CommitAchievementProcessorService extends AchievementProcessorService {

    private countGoal: number;


    public constructor(achievementId: number, countGoal: number) {
        super(achievementId);
        this.countGoal = countGoal;
    }

    public process(event: CommitEventDto): Observable<number> {
        return this.isObtained(event.userHash).pipe(map(response => {
            let obtainedAchievement = null;
            if (!response.data && event.numberOfCommit >= this.countGoal) {
                obtainedAchievement = this.achievementId;
            }
            return obtainedAchievement;
        }));
    }
}
