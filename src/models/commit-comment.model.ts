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
    public reviewerExpercience: number;
    public static fromSmartContract(commentVals: Array<any>, userName: string): CommitComment{ 
        let comment = new CommitComment(); 
        comment.text = commentVals[0]; 
        comment.score = Math.round(commentVals[1] / 100); 
        comment.vote = commentVals[2];
        comment.creationDateMs = commentVals[3];
        comment.lastModificationDateMs = commentVals[4] * 1000;
        comment.user = commentVals[5];
        comment.name = userName;
        comment.cleanCode = commentVals[6][0] / 100;
        comment.difficulty = commentVals[6][1] / 100;
        comment.reviewerExpercience = commentVals[6][2] / 100;
        return comment;
    } 
}
