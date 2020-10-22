import { AchievementEventDto } from "./achievement-event.dto";
import { BackendConfig } from "../../backend.config";

export class DeleteEventDto extends AchievementEventDto {

    public constructor(teamUid: string, userHash: string, url: string, version: string) {
        super();
        this.teamUid = teamUid;
        this.userHash = userHash;
        this.url = url;
        this.timestamp = Date.now();
        this.version = version;
        this.eventType =  BackendConfig.EventTypeEnum.Delete;
    }
}
