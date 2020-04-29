import { AchievementEventDto } from "./achievement-event.dto";
import { BackendConfig } from "../../backend.config";

export class ReviewEventDto extends AchievementEventDto {

    public constructor(teamUid: string, userHash: string, numberOfReviewMade: number, timestamp: number) {
        super();
        this.teamUid = teamUid;
        this.userHash = userHash;
        this.count = numberOfReviewMade;
        this.timestamp = timestamp;
        this.eventType = BackendConfig.EventTypeEnum.Review;
    }
}
