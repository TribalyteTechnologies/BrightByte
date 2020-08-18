import { AppConfig } from "../app.config";
import { EncryptionUtils } from "../core/encryption-utils";

export class UserReputation { 
    public email: string; 
    public name: string;
    public reputation: number;
    public numberReviewsMade: number;
    public numberCommitsMade: number;
    public agreedPercentage: number;
    public userPosition: number;
    public userHash: string;
    public engagementIndex: number;
    public isRanked: boolean;

    public static fromSmartContract(userVals: Array<string>): UserReputation{ 
        let user = new UserReputation(); 
        user.name = EncryptionUtils.decode(userVals[0]);
        user.email = EncryptionUtils.decode(userVals[1]);
        user.reputation = Math.round((parseInt(userVals[2]) / AppConfig.WEIGHT_REPUTATION_FACTOR) * 100) / 100;
        user.numberReviewsMade = parseInt(userVals[3]);
        user.numberCommitsMade = parseInt(userVals[4]);
        user.agreedPercentage = parseInt(userVals[5]);
        user.userHash = userVals[6];
        user.userPosition = 0;
        let engagementIndex = (user.numberCommitsMade * AppConfig.COMMIT_WEIGHT) + (user.numberReviewsMade * AppConfig.REVIEW_WEIGHT);
        user.engagementIndex = Math.round(engagementIndex *  AppConfig.SCORE_DIVISION_FACTOR) /  AppConfig.SCORE_DIVISION_FACTOR;
        user.isRanked = true;
        return user; 
    }

    public static fromSmartContractGlobalReputation(userVals: Array<any>): UserReputation{ 
        let user = new UserReputation(); 
        user.name = EncryptionUtils.decode(userVals[0]);
        user.email = EncryptionUtils.decode(userVals[1]);
        user.reputation = 0;
        user.numberReviewsMade = parseInt(userVals[2]);
        user.numberCommitsMade = parseInt(userVals[3]);
        user.agreedPercentage = parseInt(userVals[4]);
        user.userHash = userVals[5];
        user.userPosition = 0;
        let engagementIndex = (user.numberCommitsMade * AppConfig.COMMIT_WEIGHT) + (user.numberReviewsMade * AppConfig.REVIEW_WEIGHT);
        user.engagementIndex = Math.round(engagementIndex *  AppConfig.SCORE_DIVISION_FACTOR) /  AppConfig.SCORE_DIVISION_FACTOR;
        user.isRanked = true;
        return user; 
    }
} 
