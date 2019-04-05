import { AppConfig } from "../app.config";
import { UserDetails } from "./user-details.model";
import { FormatUtils } from "../core/format-utils";

export class UserCommit { 
    public url = ""; 
    public urlHash = "";
    public title = "";
    public author = "";
    public project = ""; 
    public isPending = false; 
    public isReadNeeded = false;
    public score = 0;
    public creationDateMs = 0;
    public lastModificationDateMs = 0;
    public numberReviews = 0;
    public currentNumberReviews = 0;
    public reviewers: UserDetails[][];
    public reviewsAlreadyDone = new Array<string>();

    public static fromSmartContract(commitVals: Array<any>, isPending: boolean): UserCommit{ 
        let commit = new UserCommit();
        if(commitVals[0] !== "") {
            commit.url = commitVals[0];
            commit.urlHash = FormatUtils.getHashFromUrl(commit.url);
            commit.title = commitVals[1];
            commit.author = commitVals[2];
            commit.project = FormatUtils.getProjectFromUrl(commit.url);
            commit.isPending = isPending;
            commit.creationDateMs = commitVals[3] * AppConfig.SECS_TO_MS;
            commit.lastModificationDateMs = commitVals[4] * AppConfig.SECS_TO_MS;
            commit.isReadNeeded = commitVals[5];
            commit.numberReviews = commitVals[6];
            commit.currentNumberReviews = commitVals[7];
            commit.score = Math.round(commitVals[8] / AppConfig.SCORE_DIVISION_FACTOR) ;
            commit.reviewers = [];
            commit.reviewsAlreadyDone =  new Array<string>();
        }
        return commit;
    }
}
