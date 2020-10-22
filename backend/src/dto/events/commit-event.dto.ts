import { AchievementEventDto } from "./achievement-event.dto";
import { BackendConfig } from "../../backend.config";

export class CommitEventDto extends AchievementEventDto {

    public constructor(teamUid: string, userHash: string, numberOfCommit: number, timestamp: number, version: string) {
        super();
        this.teamUid = teamUid;
        this.userHash = userHash;
        this.count = numberOfCommit;
        this.timestamp = timestamp;
        this.version = version;
        this.eventType = BackendConfig.EventTypeEnum.Commit;
    }
}
