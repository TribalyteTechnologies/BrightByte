export class UserCommit { 
    public url: string; 
    public title: string; 
    public project: string; 
    public isPending: boolean; 
    public isReadNeeded: boolean;
    public score: number;
    private static readonly DIVISION_FACTOR = 100;
    public static fromSmartContract(commitVals: Array<any>): UserCommit{ 
        let commit = new UserCommit(); 
        commit.url = commitVals[0]; 
        commit.title = commitVals[1]; 
        commit.project = commitVals[2]; 
        commit.isPending = commitVals[3]; 
        commit.isReadNeeded = commitVals[4];
        commit.score = commitVals[5]/this.DIVISION_FACTOR;
        return commit;
    } 
}
