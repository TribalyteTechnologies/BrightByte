export class UserReputation { 
    public email: string; 
    public reputation: number;
    private static readonly DIVISION_FACTOR = 100;
    public static fromSmartContract(userVals: Array<any>): UserReputation{ 
        let user = new UserReputation(); 
        user.email = userVals[0]; 
        user.reputation = userVals[1] / this.DIVISION_FACTOR; 
        return user; 
    } 
} 
