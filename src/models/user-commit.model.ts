import { AppConfig } from "../app.config";
import { SplitService } from "../domain/split.service";

export class UserCommit { 
    public url: string; 
    public title: string;
    public author: string;
    public project: string; 
    public isPending: boolean; 
    public isReadNeeded: boolean;
    public score: number;
    public creationDateMs: number;
    public lastModificationDateMs: number;
    public splitService: SplitService;

    public static fromSmartContract(commitVals: Array<any>): UserCommit{ 
        let commit = new UserCommit(); 
        commit.url = commitVals[0]; 
        commit.title = commitVals[1];
        commit.author = commitVals[2];
        commit.project = commit.splitService.getProject(commit.url);
        //commit.isPending = commitVals[3]; 
        commit.isReadNeeded = commitVals[4];
        //commit.score = commitVals[5] / AppConfig.SCORE_DIVISION_FACTOR;
        commit.creationDateMs = commitVals[3] * 1000;
        commit.lastModificationDateMs = commitVals[5] * 1000;
        return commit;
    } 
}
