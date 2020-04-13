import { AchievementEventDto } from "./achievement-event.dto";
import { BackendConfig } from "../../backend.config";

export class DeleteEventDto extends AchievementEventDto {

    public constructor(teamUid: number, userHash: string, url: string) {
        super();
        this.teamUid = teamUid;
        this.userHash = userHash;
        this.url = url;
        this.timestamp = Date.now();
        this.eventType =  BackendConfig.EventTypeEnum.Delete;
    }
}
