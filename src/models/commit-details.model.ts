export class CommitDetails { 
    public url: string; 
    public title: string; 
    public author: string; 
    public timestampMs: number; 
    public numberReviews: number; 
    public isPending: boolean; 
    public currentNumberReviews: number; 
    public static fromSmartContract(commitVals: Array<any>): CommitDetails{ 
        let commit = new CommitDetails();
        let timestampMs = commitVals[3] * 1000;
        commit.url = commitVals[0]; 
        commit.title = commitVals[1]; 
        commit.author = commitVals[2]; 
        commit.timestampMs = timestampMs;
        commit.numberReviews = commitVals[4]; 
        commit.isPending = commitVals[5]; 
        commit.currentNumberReviews = commitVals[6]; 
        return commit; 
    } 
} 
