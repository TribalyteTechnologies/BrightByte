import { AppConfig } from "../app.config";

export class CommitComment { 
    public text: string; 
    public user: string;
    public name: string; 
    public vote: number;
    public creationDateMs: number;
    public lastModificationDateMs: number;
    public cleanCode: number;
    public difficulty: number;
    public reviewerExperience: number;
    
    public static fromSmartContract(commentVals: Array<any>, userName: string): CommitComment{ 
        let comment = new CommitComment(); 

        comment.text = commentVals[0];
        comment.vote = commentVals[1];
        comment.creationDateMs = commentVals[2];
        comment.lastModificationDateMs = commentVals[3] * AppConfig.SECS_TO_MS;
        comment.user = commentVals[4];
        comment.name = userName;
        comment.cleanCode = commentVals[5][0] / AppConfig.SCORE_DIVISION_FACTOR;
        comment.difficulty = commentVals[5][1] / AppConfig.SCORE_DIVISION_FACTOR;
        comment.reviewerExperience = commentVals[5][2] / AppConfig.SCORE_DIVISION_FACTOR;
        return comment;
    } 
}
