import { AchievementEventDto } from "./achievement-event.dto";
import { BackendConfig } from "../backend.config";

export class ReviewEventDto extends AchievementEventDto {

    public constructor(userHash: string, numberOfReviewMade: number) {
        super();
        this.userHash = userHash;
        this.count = numberOfReviewMade;
        this.timestamp = Date.now();
        this.eventType = BackendConfig.EventTypeEnum.Review;
    }
}
