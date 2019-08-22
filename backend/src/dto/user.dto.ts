export class UserDto {
    public constructor(
        public id: string,
        public commitCount: number,
        public reviewCount: number,
        public obtainedAchievements: Array<string>
    ) { }
}
