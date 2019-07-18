export class ReviewEvent{
    public userHash: string;    
    public numberOfReviewMade: number;

    public constructor(userHash: string, numberOfReviewMade: number){
        this.userHash = userHash;
        this.numberOfReviewMade = numberOfReviewMade;
    }
}
