export class CommitToReview { 
    public url: string; 
    public title: string; 
    public name: string;  
    public static fromSmartContract(commitVals: Array<any>): CommitToReview{ 
        let commit = new CommitToReview(); 
        commit.url = commitVals[0]; 
        commit.title = commitVals[1]; 
        commit.name = commitVals[2]; 
        return commit;
    } 
}
