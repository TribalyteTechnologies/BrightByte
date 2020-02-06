import { BackendConfig } from "../backend.config";

export class UserDetailsDto { 
    public name: string;
    public email: string;
    public numReviews: number;
    public agreedPercentage: number;
    public numberOfCommits: number;
    public finishedReviews: number;
    public userHash: string;

    public static fromSmartContract(userVals: Array<any>): UserDetailsDto{ 
        let user = new UserDetailsDto(); 
        user.name = userVals[0];
        user.email = userVals[1];
        user.numberOfCommits = parseInt(userVals[2]);
        user.finishedReviews = parseInt(userVals[3]);
        user.agreedPercentage = userVals[4];
        user.userHash = userVals[5];
        return user; 
    } 
} 
