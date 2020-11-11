import { GithubCommitResponse } from "./github-commit.model";

export class CommitInfo {
    public hash: string;
    public name: string;
    public date: Date;

    public static fromSmartContract(commitResponse: GithubCommitResponse): CommitInfo{ 
        let comDate = new Date(commitResponse.commit.author.date);
        let commit = new CommitInfo(commitResponse.sha, commitResponse.commit.message, comDate); 
        return commit;
    } 

    constructor(hash: string, name: string, date: Date){
        this.hash = hash;
        this.name = name;
        this.date = date;
    }
}
