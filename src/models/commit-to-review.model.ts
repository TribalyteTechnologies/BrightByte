import { AppConfig } from "../app.config";

export class CommitToReview { 
    public url: string; 
    public title: string; 
    public name: string;
    public creationDateMs: number;
    public lastModificationDateMs: number;
    public project: string;
    public static fromSmartContract(commitVals: Array<any>): CommitToReview{ 
        let commit = new CommitToReview(); 
        commit.url = commitVals[0]; 
        commit.title = commitVals[1]; 
        commit.name = commitVals[2];
        commit.creationDateMs = commitVals[3] * AppConfig.SECS_TO_MS;
        commit.lastModificationDateMs = commitVals[4] * AppConfig.SECS_TO_MS;
        commit.project = commitVals[5];
        return commit;
    } 
}
