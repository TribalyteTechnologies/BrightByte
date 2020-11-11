import { AchievementEventDto } from "./achievement-event.dto";
import { BackendConfig } from "../../backend.config";

export class DeleteEventDto extends AchievementEventDto {

    public constructor(teamUid: number, userHash: string, url: string, version: number) {
        super();
        this.teamUid = teamUid;
        this.userHash = userHash;
        this.url = url;
        this.timestamp = Date.now();
        this.version = version;
        this.eventType =  BackendConfig.EventTypeEnum.Delete;
    }
}
