import { AppConfig } from "../app.config";

export class UserDetails { 
    public name: string; 
    public email: string; 
    public numberCommitsReviewedByMe: number; 
    public numberCommitsToReviewByMe: number; 
    public numbermyCommitsPending: number;
    public reputation: number;
    public agreedPercentage: number;
    public userHash: string;
    public static fromSmartContract(userVals: Array<any>): UserDetails{ 
        let user = new UserDetails(); 
        user.name = userVals[0]; 
        user.email = userVals[1]; 
        user.numberCommitsReviewedByMe = userVals[2]; 
        user.numberCommitsToReviewByMe = userVals[3];
        user.numbermyCommitsPending = userVals[4];
        user.reputation = userVals[5] / AppConfig.SCORE_DIVISION_FACTOR;
        user.agreedPercentage = userVals[6];
        user.userHash = userVals[7];
        return user; 
    } 
} 
