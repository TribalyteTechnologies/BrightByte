export class CommitDetails { 
    public url: string; 
    public title: string; 
    public author: string; 
    public timestamp: number; 
    public numberReviews: number; 
    public isPending: boolean; 
    public currentNumberReviews: number; 
    public static fromSmartContract(commitVals: Array<any>): CommitDetails{ 
        let commit = new CommitDetails(); 
        commit.url = commitVals[0]; 
        commit.title = commitVals[1]; 
        commit.author = commitVals[2]; 
        commit.timestamp = commitVals[3]; 
        commit.numberReviews = commitVals[4]; 
        commit.isPending = commitVals[5]; 
        commit.currentNumberReviews = commitVals[6]; 
        return commit; 
    } 
} 
