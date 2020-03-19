export class CommentDetailsDto { 
    public text: string;
    public vote: number;
    public creationDate: number;
    public lastModificationDate: number;
    public author: string;
    public points: Array<number>;

    public static fromSmartContract(userVals: Array<any>): CommentDetailsDto{ 
        let user = new CommentDetailsDto(); 
        user.text = userVals[0];
        user.vote = userVals[1];
        user.creationDate = parseInt(userVals[2]);
        user.lastModificationDate = parseInt(userVals[3]);
        user.author = userVals[4];
        user.points = userVals[5];
        return user; 
    } 
} 
