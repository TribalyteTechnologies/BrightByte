export class UserCommit { 
    public url: string; 
    public title: string; 
    public project: string; 
    public isPending: boolean; 
    public isReadNeeded: boolean; 
    public static fromSmartContract(commitVals: Array<any>): UserCommit{ 
        let commit = new UserCommit(); 
        commit.url = commitVals[0]; 
        commit.title = commitVals[1]; 
        commit.project = commitVals[2]; 
        commit.isPending = commitVals[3]; 
        commit.isReadNeeded = commitVals[4]; 
        return commit;
    } 
}
