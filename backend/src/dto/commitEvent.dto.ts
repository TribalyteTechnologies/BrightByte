import { AchievementEventDto } from "./achievementEvent.dto";

export class CommitEventDto extends AchievementEventDto {

    public constructor(userHash: string, numberOfCommit: number) {
        super();
        this.userHash = userHash;
        this.count = numberOfCommit;
        this.timestamp = Date.now();
    }
}

