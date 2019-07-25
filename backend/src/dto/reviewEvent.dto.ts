import { AchievementEventDto } from "./achievementEvent.dto";

export class ReviewEventDto extends AchievementEventDto {

    public constructor(userHash: string, numberOfReviewMade: number) {
        super();
        this.userHash = userHash;
        this.count = numberOfReviewMade;
        this.timestamp = Date.now();
    }
}
