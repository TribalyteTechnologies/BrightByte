export class UserDetails { 
    public name: string; 
    public email: string; 
    public numberReviewsMade: number;
    public numberCommitsMade: number;
    public agreedPercentage: number;
    public userHash: string;
    public static fromSmartContract(userVals: Array<any>): UserDetails{ 
        let user = new UserDetails(); 
        user.name = userVals[0]; 
        user.email = userVals[1]; 
        user.numberReviewsMade = userVals[2]; 
        user.numberCommitsMade = userVals[3];
        user.agreedPercentage = userVals[4];
        user.userHash = userVals[5];
        return user; 
    } 
} 
