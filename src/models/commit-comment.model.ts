import { AppConfig } from "../app.config";

export class CommitComment { 
    public text: string; 
    public user: string;
    public name: string; 
    public score: number; 
    public vote: number;
    public creationDateMs: number;
    public lastModificationDateMs: number;
    public cleanCode: number;
    public difficulty: number;
    public reviewerExperience: number;
    
    public static fromSmartContract(commentVals: Array<any>, userName: string): CommitComment{ 
        let comment = new CommitComment(); 

        comment.text = commentVals[0]; 
        comment.score = Math.round(commentVals[1] / AppConfig.SCORE_DIVISION_FACTOR); 
        comment.vote = commentVals[2];
        comment.creationDateMs = commentVals[3];
        comment.lastModificationDateMs = commentVals[4] * AppConfig.DATE_MULTIPLY_FACTOR;
        comment.user = commentVals[5];
        comment.name = userName;
        comment.cleanCode = commentVals[6][0] / AppConfig.SCORE_DIVISION_FACTOR;
        comment.difficulty = commentVals[6][1] / AppConfig.SCORE_DIVISION_FACTOR;
        comment.reviewerExperience = commentVals[6][2] / AppConfig.SCORE_DIVISION_FACTOR;
        return comment;
    } 
}
