import { AppConfig } from "../app.config";
import { UserDetails } from "./user-details.model";
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
    public reviewers: UserDetails[][];

    public static getProjectFromUrl(url: string): string {
        return url.split("/")[4];
    }

    public static fromSmartContract(commitVals: Array<any>, isPending: boolean): UserCommit{ 
        let commit = new UserCommit(); 
        commit.url = commitVals[0]; 
        commit.title = commitVals[1];
        commit.author = commitVals[2];
        commit.project = UserCommit.getProjectFromUrl(commit.url);
        commit.isPending = isPending;
        commit.creationDateMs = commitVals[3] * 1000;
        commit.lastModificationDateMs = commitVals[4] * 1000;
        commit.isReadNeeded = commitVals[5];
        commit.numberReviews = commitVals[6];
        commit.currentNumberReviews = commitVals[7];
        commit.score = Math.round(commitVals[8] / AppConfig.SCORE_DIVISION_FACTOR) ;
        commit.reviewers = [];
        return commit;
    } 
}
