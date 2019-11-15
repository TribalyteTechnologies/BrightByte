export class User {
    public name = "";
    public email = "";
    public hash = "";
    public globalStats: UserStats = new UserStats();
    public seasonData = new Array<UserSeason>();
}

export class UserDataCsv {
    public name = "";
    public email = "";
    public hash = "";
    public from = "Season";
    public stats: UserStats = new UserStats();
}

export class UserStats {
    public reputation = 0;
    public numberOfTimesReview = 0;
    public agreedPercentage = 0;
    public positiveVotes = 0;
    public negativeVotes = 0;
    public reviewsMade = 0;
    public numberOfCommits = 0;
}

export class UserSeason {
    public seasonStats: UserStats = new UserStats();
}
