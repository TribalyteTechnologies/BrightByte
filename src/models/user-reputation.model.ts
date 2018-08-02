import { AppConfig } from "../app.config";

export class UserReputation { 
    public email: string; 
    public reputation: number;
    public numReviews: number;
    public static fromSmartContract(userVals: Array<any>): UserReputation{ 
        let user = new UserReputation(); 
        user.email = userVals[0]; 
        user.reputation = userVals[1] / AppConfig.SCORE_DIVISION_FACTOR; 
        user.numReviews = userVals[2];
        return user; 
    } 
} 
