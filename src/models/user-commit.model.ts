import { AppConfig } from "../app.config";
import { UserDetails } from "./user-details.model";
import { UtilsService } from "../core/utils.service";

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
    public reviewsAlreadyDone: string[];

    public static getProjectFromUrl(url: string): string {
        let utilsSrv = new UtilsService();
        return utilsSrv.getProjectFromUrl(url);
    }

    public static fromSmartContract(commitVals: Array<any>, isPending: boolean): UserCommit{ 
        let utilsSrv = new UtilsService();
        let commit = new UserCommit(); 
        commit.url = commitVals[0]; 
        commit.urlHash = utilsSrv.getHashFromUrl(commit.url);
        commit.title = commitVals[1];
        commit.author = commitVals[2];
        commit.project = UserCommit.getProjectFromUrl(commit.url);
        commit.isPending = isPending;
        commit.creationDateMs = commitVals[3] * AppConfig.DATE_MULTIPLY_FACTOR;
        commit.lastModificationDateMs = commitVals[4] * AppConfig.DATE_MULTIPLY_FACTOR;
        commit.isReadNeeded = commitVals[5];
        commit.numberReviews = commitVals[6];
        commit.currentNumberReviews = commitVals[7];
        commit.score = Math.round(commitVals[8] / AppConfig.SCORE_DIVISION_FACTOR) ;
        commit.reviewers = [];
        commit.reviewsAlreadyDone = [];
        return commit;
    }
}
