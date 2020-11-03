export class UserData {
    public constructor(
        public teamUid: string,
        public version: number,
        public commitCount?: number,
        public reviewCount?: number,
        public obtainedAchievements?: Array<string>
    ) {
        if (commitCount === undefined) {
            this.commitCount = 0;
        }
        if (reviewCount === undefined) {
            this.reviewCount = 0;
        }
        if (obtainedAchievements === undefined) {
            this.obtainedAchievements = new Array<string>();
        }
    }
}

export class UserDto {
    public teamsData: Array<UserData>;
    public constructor(
        public id: string,
        userData?: UserData
    ) {
        this.teamsData = new Array<UserData>();
        if (userData) {
            this.teamsData.push(userData);
        }
    }

}
