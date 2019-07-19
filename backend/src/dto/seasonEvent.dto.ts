import { AchievementEventDto } from "./achievementEvent.dto";

export class SeasonEventDto extends AchievementEventDto{ 
    public currentSeason: number;

    public constructor(currentSeason: number){
        super();
        this.currentSeason = currentSeason;
    }
}
