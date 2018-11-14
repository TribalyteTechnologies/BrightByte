import { AppConfig } from "../app.config";

export class UserDetails { 
    public name: string; 
    public email: string; 
    public numberCommitsReviewedByMe: number; 
    public numberCommitsToReviewByMe: number; 
    public numbermyCommitsPending: number; 
    public numbermyCommitsFinished: number;
    public reputation: number;
    public static fromSmartContract(userVals: Array<any>): UserDetails{ 
        let user = new UserDetails(); 
        user.name = userVals[0]; 
        user.email = userVals[1]; 
        user.numberCommitsReviewedByMe = userVals[2]; 
        user.numberCommitsToReviewByMe = userVals[3]; 
        user.numbermyCommitsFinished = userVals[4]; 
        user.numbermyCommitsPending = userVals[5];
        user.reputation = userVals[6] / AppConfig.SCORE_DIVISION_FACTOR; 
        return user; 
    } 
} 
