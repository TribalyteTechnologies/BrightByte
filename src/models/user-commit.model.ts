import { AppConfig } from "../app.config";

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
    public numberReviews: number;
    public currentNumberReviews: number;

    public static getProjectFromUrl(url: string): string {
        let urlSplitted = url.split("/");
        let project: string = urlSplitted[4];
        return project;
    }

    public static fromSmartContract(commitVals: Array<any>, isPending: boolean): UserCommit{ 
        let commit = new UserCommit(); 
        commit.url = commitVals[0]; 
        commit.title = commitVals[1];
        commit.author = commitVals[2];
        commit.project = UserCommit.getProjectFromUrl(commit.url);
        commit.isPending = isPending;
        commit.creationDateMs = commitVals[3] *1000;
        commit.lastModificationDateMs = commitVals[4] *1000;
        commit.isReadNeeded = commitVals[5];
        commit.numberReviews = commitVals[6];
        commit.currentNumberReviews = commitVals[7];
        //commit.score = commitVals[5] / AppConfig.SCORE_DIVISION_FACTOR;
        return commit;
    } 
}
