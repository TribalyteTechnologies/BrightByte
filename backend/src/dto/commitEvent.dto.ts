import { AchievementEventDto } from "./achievementEvent.dto";

export class CommitEventDto extends AchievementEventDto{
    public userHash: string;    
    public numberOfCommit: number;

    public constructor(userHash: string, numberOfCommit: number){
        super();
        this.userHash = userHash;
        this.numberOfCommit = numberOfCommit;
    }
}

