export class CommitEvent{
    public userHash: string;    
    public numberOfCommit: number;

    public constructor(userHash: string, numberOfCommit: number){
        this.userHash = userHash;
        this.numberOfCommit = numberOfCommit;
    }
}

