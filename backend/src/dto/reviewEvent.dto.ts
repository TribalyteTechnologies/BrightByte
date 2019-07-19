import { AchievementEventDto } from "./achievementEvent.dto";

export class ReviewEventDto extends AchievementEventDto{
    public userHash: string;    
    public numberOfReviewMade: number;

    public constructor(userHash: string, numberOfReviewMade: number){
        super();
        this.userHash = userHash;
        this.numberOfReviewMade = numberOfReviewMade;
    }
}
