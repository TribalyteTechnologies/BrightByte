import { AppConfig } from "../app.config";
import { EncryptionUtils } from "../core/encryption-utils";

export class CommitComment { 
    public text: string; 
    public user: string;
    public name: string; 
    public vote: number;
    public creationDateMs: number;
    public lastModificationDateMs: number;
    public quality: number;
    public difficulty: number;
    public confidence: number;
    
    public static fromSmartContract(commentVals: Array<string>, userName: string): CommitComment{ 
        let comment = new CommitComment(); 

        comment.text = EncryptionUtils.decode(commentVals[0]);
        comment.vote = parseInt(commentVals[1]);
        comment.creationDateMs = parseInt(commentVals[2]);
        comment.lastModificationDateMs = parseInt(commentVals[3]) * AppConfig.SECS_TO_MS;
        comment.user = commentVals[4];
        comment.name = EncryptionUtils.decode(userName);
        const commentScore = commentVals[5];
        comment.quality = parseInt(commentScore[0]) / AppConfig.SCORE_DIVISION_FACTOR;
        comment.difficulty = parseInt(commentScore[1]) / AppConfig.SCORE_DIVISION_FACTOR;
        comment.confidence = parseInt(commentScore[2]) / AppConfig.SCORE_DIVISION_FACTOR;
        return comment;
    } 
}
