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
    public static fromSmartContract(commitVals: Array<any>): CommitDetails{ 
        let commit = new CommitDetails();
        commit.url = commitVals[0]; 
        commit.title = commitVals[1]; 
        commit.author = commitVals[2];
        commit.creationDate = commitVals[3];
        commit.lastModDate = commitVals[4];
        commit.isReadNeeded = commitVals[5];
        commit.numberReviews = commitVals[6]; 
        commit.currentNumberReviews = commitVals[7];
        commit.score = commitVals [8];
        return commit; 
    } 
} 
