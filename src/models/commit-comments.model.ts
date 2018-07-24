export class CommitComments { 
    public text: string; 
    public user: string; 
    public name: string; 
    public score: number; 
    public vote: number;
    public creationDateMs: number;
    public lastModificationDateMs: number;
    public static fromSmartContract(commentVals: Array<any>): CommitComments{ 
        let comment = new CommitComments(); 
        comment.text = commentVals[0]; 
        comment.user = commentVals[1]; 
        comment.name = commentVals[2]; 
        comment.score = commentVals[3]; 
        comment.vote = commentVals[4];
        comment.lastModificationDateMs = commentVals[5] * 1000;
        return comment;
    } 
}
