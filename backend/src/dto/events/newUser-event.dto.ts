import { AchievementEventDto } from "./achievement-event.dto";
import { BackendConfig } from "../../backend.config";

export class NewUserEventDto extends AchievementEventDto {

    public constructor(teamUid: number, userHash: string, version: number) {
        super();
        this.teamUid = teamUid;
        this.userHash = userHash;
        this.timestamp = Date.now();
        this.eventType =  BackendConfig.EventTypeEnum.NewUser;
        this.version = version;
    }
}
