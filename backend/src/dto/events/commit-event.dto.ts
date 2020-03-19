import { AchievementEventDto } from "./achievement-event.dto";
import { BackendConfig } from "../../backend.config";

export class CommitEventDto extends AchievementEventDto {

    public constructor(userHash: string, numberOfCommit: number, timestamp: number) {
        super();
        this.userHash = userHash;
        this.count = numberOfCommit;
        this.timestamp = timestamp;
        this.eventType = BackendConfig.EventTypeEnum.Commit;
    }
}

