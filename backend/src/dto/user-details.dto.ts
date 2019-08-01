import { BackendConfig } from "../backend.config";

export class UserDetailsDto { 
    public email: string;
    public reputation: number; 
    public numReviews: number;
    public agreedPercentage: number;
    public numberOfCommits: number;
    public finishedReviews: number;
    public userHash: string;

    public static fromSmartContract(userVals: Array<any>): UserDetailsDto{ 
        let user = new UserDetailsDto(); 
        user.email = userVals[0]; 
        user.reputation = userVals[1] / BackendConfig.SCORE_DIVISION_FACTOR; 
        user.numReviews = userVals[2];
        user.agreedPercentage = userVals[4];
        user.numberOfCommits = parseInt(userVals[5]);
        user.finishedReviews = parseInt(userVals[6]);
        user.userHash = userVals[7];
        return user; 
    } 
} 
