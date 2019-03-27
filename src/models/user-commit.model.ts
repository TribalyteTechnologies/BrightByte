import { AppConfig } from "../app.config";
import { UserDetails } from "./user-details.model";
import { FormatUtils } from "../core/format-utils";

export class UserCommit { 
    public url: string;
    public urlHash: string;
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

    public static fromSmartContract(commitVals: Array<any>, isPending: boolean): UserCommit{ 
        let commit = new UserCommit(); 
        commit.url = commitVals[0];
        commit.urlHash = FormatUtils.getHashFromUrl(commit.url);
        commit.title = commitVals[1];
        commit.author = commitVals[2];
        commit.project = FormatUtils.getProjectFromUrl(commit.url);
        commit.isPending = isPending;
        commit.creationDateMs = commitVals[3] * AppConfig.DATE_MULTIPLY_FACTOR;
        commit.lastModificationDateMs = commitVals[4] * AppConfig.DATE_MULTIPLY_FACTOR;
        commit.isReadNeeded = commitVals[5];
        commit.numberReviews = commitVals[6];
        commit.currentNumberReviews = commitVals[7];
        commit.score = commitVals[8] / AppConfig.SCORE_DIVISION_FACTOR ;
        commit.reviewers = [];
        return commit;
    } 
}
