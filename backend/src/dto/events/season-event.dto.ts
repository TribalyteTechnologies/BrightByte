import { AchievementEventDto } from "./achievement-event.dto";
import { BackendConfig } from "src/backend.config";

export class SeasonEventDto extends AchievementEventDto {

    public constructor(currentSeason: number) {
        super();
        this.currentSeason = currentSeason;
        this.timestamp = Date.now();
        this.eventType = BackendConfig.EventTypeEnum.Season;
    }
}
