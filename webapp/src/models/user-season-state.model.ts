export class UserSeasonState { 
    public pendingReviews: number; 
    public finishedReviews: number; 
    public seasonCommits: number; 
    public commitsToRead: number; 
    public totalReviews: number; 

    public static fromSmartContract(state: Array<any>): UserSeasonState{ 
        let seasonState = new UserSeasonState(); 
        seasonState.pendingReviews = state[0];
        seasonState.finishedReviews = state[1];
        seasonState.seasonCommits = state[2];
        seasonState.commitsToRead = state[3];
        seasonState.totalReviews = state[4];
        return seasonState; 
    } 
}
