import { AppConfig } from "../app.config";

export class UserReputation { 
    public email: string; 
    public name: string;
    public reputation: number;
    public numReviews: number;
    public agreedPercentage: number;
    public numberOfCommits: number;
    public finishedReviews: number;
    public userPosition: number;
    public userHash: string;
    public engagementIndex: number;
    public isRanked: boolean;
    public static fromSmartContract(userVals: Array<any>): UserReputation{ 
        let user = new UserReputation(); 
        user.email = userVals[0]; 
        user.reputation = userVals[1] / AppConfig.REPUTATION_FACTOR; 
        user.numReviews = userVals[2];
        user.name = userVals[3];
        user.agreedPercentage = userVals[4];
        user.numberOfCommits = parseInt(userVals[5]);
        user.finishedReviews = parseInt(userVals[6]);
        user.userHash = userVals[7];
        user.userPosition = 0;
        let engagementIndex = (user.numberOfCommits * AppConfig.COMMIT_WEIGHT) + (user.finishedReviews * AppConfig.REVIEW_WEIGHT);
        user.engagementIndex = Math.round(engagementIndex *  AppConfig.SCORE_DIVISION_FACTOR) /  AppConfig.SCORE_DIVISION_FACTOR;
        user.isRanked = true;
        return user; 
    } 
} 
