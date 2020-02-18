export class User {
    public name = "";
    public email = "";
    public hash = "";
    public pendingCommits = new Array<string>();
    public finishedReviews = new Array<string>();
    public pendingReviews = new Array<string>();
    public toRead = new Array<string>();
    public globalStats: UserStats = new UserStats();
    public seasonData = new Array<UserSeason>();
}

export class UserStats {
    public reputation = 0;
    public cumulativeComplexity = 0;
    public agreedPercentage = 0;
    public positiveVotes = 0;
    public negativeVotes = 0;
    public reviewsMade = 0;
    public commitsMade = 0;
}

export class UserSeason {
    public seasonStats: UserStats = new UserStats();
    public urlSeasonCommits = new Array<string>();
    public finishedReviews = new Array<string>();
    public pendingReviews = new Array<string>();
    public toRead = new Array<string>();
}

export class CommitDataMigraton {
    public title = "";
    public url = "";
    public author = "";
    public creationDate = 0;
    public isReadNeeded = false;
    public numberReviews = 0;
    public currentNumberReviews = 0;
    public lastModificationDate = 0;
    public score = 0;
    public weightedComplexity = 0;
    public pendingComments = new Array<string>();
    public finishedComments = new Array<string>();
    public commentDataMigration = new Array<CommentDataMigration>();
}

export class CommentDataMigration {
    public text = "";
    public user = "";
    public points = new Array<number>();
    public vote = 0;
    public creationDateComment = 0;
    public lastModificationDateComment = 0;
    public isReadNeeded = false;
}

