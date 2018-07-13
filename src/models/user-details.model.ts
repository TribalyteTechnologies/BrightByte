export class UserDetails { 
    public name: string; 
    public email: string; 
    public numberCommitsReviewedByMe: number; 
    public numberCommitsToReviewByMe: number; 
    public numbermyCommits: number; 
    public reputation: number;
    public static fromSmartContract(userVals: Array<any>): UserDetails{ 
        let user = new UserDetails(); 
        user.name = userVals[0]; 
        user.email = userVals[1]; 
        user.numberCommitsReviewedByMe = userVals[2]; 
        user.numberCommitsToReviewByMe = userVals[3]; 
        user.numbermyCommits = userVals[4]; 
        user.reputation = userVals[5]/100; 
        return user; 
    } 
} 
