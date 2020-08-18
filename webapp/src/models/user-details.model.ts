import { EncryptionUtils } from "../core/encryption-utils";

export class UserDetails { 
    public name: string; 
    public email: string; 
    public numberReviewsMade: number;
    public numberCommitsMade: number;
    public agreedPercentage: number;
    public userHash: string;
    public static fromSmartContract(userVals: Array<string>): UserDetails{ 
        let user = new UserDetails(); 
        user.name = EncryptionUtils.decode(userVals[0]);
        user.email = EncryptionUtils.decode(userVals[1]);
        user.numberReviewsMade = parseInt(userVals[2]); 
        user.numberCommitsMade = parseInt(userVals[3]);
        user.agreedPercentage = parseInt(userVals[4]);
        user.userHash = userVals[5];
        return user; 
    } 
} 
