import { EncryptionUtils } from "../core/encryption-utils";

export class CommitDetails { 
    public url: string; 
    public title: string; 
    public author: string; 
    public creationDate: number;
    public lastModDate: number;
    public isReadNeeded: boolean;
    public numberReviews: number;
    public currentNumberReviews: number; 
    public score: number;
    public static fromSmartContract(commitVals: Array<string>): CommitDetails{ 
        let commit = new CommitDetails();
        commit.url = EncryptionUtils.decode(commitVals[0]); 
        commit.title = EncryptionUtils.decode(commitVals[1]);
        commit.author = commitVals[2];
        commit.creationDate = parseInt(commitVals[3]);
        commit.lastModDate = parseInt(commitVals[4]);
        commit.isReadNeeded = commitVals[5].toString() === "true";
        commit.numberReviews = parseInt(commitVals[6]); 
        commit.currentNumberReviews = parseInt(commitVals[7]);
        commit.score = Math.round(parseInt(commitVals[8]));
        return commit; 
    } 
} 
