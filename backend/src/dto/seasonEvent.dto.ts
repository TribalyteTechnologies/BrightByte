import { AchievementEventDto } from "./achievementEvent.dto";

export class SeasonEventDto extends AchievementEventDto {

    public constructor(currentSeason: number) {
        super();
        this.currentSeason = currentSeason;
        this.timestamp = Date.now();
    }
}
