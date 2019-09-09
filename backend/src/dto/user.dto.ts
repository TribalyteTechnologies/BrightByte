export class UserDto {
    public constructor(
        public id: string,
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
            this.obtainedAchievements = [];
        }
    }

}
