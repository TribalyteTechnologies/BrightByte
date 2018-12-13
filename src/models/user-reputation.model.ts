import { AppConfig } from "../app.config";

export class UserReputation { 
    public email: string; 
    public name: string;
    public reputation: number;
    public numReviews: number;
    public numberOfPoints: number;
    public agreedPercentage: number;
    public numberOfCommits: number;
    public finishedReviews: number;
    public userPosition: number;
    public userHash: string;
    public static fromSmartContract(userVals: Array<any>): UserReputation{ 
        let user = new UserReputation(); 
        user.email = userVals[0]; 
        user.reputation = userVals[1] / AppConfig.SCORE_DIVISION_FACTOR; 
        user.numReviews = userVals[2];
        user.numberOfPoints = userVals[3];
        user.name = userVals[4];
        user.agreedPercentage = userVals[5];
        user.numberOfCommits = userVals[6];
        user.finishedReviews = userVals[7];
        user.userHash = userVals[8];
        user.userPosition = 0;
        return user; 
    } 
} 
