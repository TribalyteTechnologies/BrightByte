export class CommitComment { 
    public text: string; 
    public user: string;
    public name: string; 
    public score: number; 
    public vote: number;
    public creationDateMs: number;
    public lastModificationDateMs: number;
    public static fromSmartContract(commentVals: Array<any>, userName:string): CommitComment{ 
        let comment = new CommitComment(); 
        comment.text = commentVals[0]; 
        comment.score = commentVals[1]; 
        comment.vote = commentVals[2];
        comment.creationDateMs = commentVals[3];
        comment.lastModificationDateMs = commentVals[4] * 1000;
        comment.user = commentVals[5];
        comment.name = userName;  
        return comment;
    } 
}
