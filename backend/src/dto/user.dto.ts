export class UserDto{
    public id: string;
    public commitCount: number;
    public reviewCount: number;
    public obtainedAchievements: number[];

    public constructor(id: string, commitCount: number, reviewCount: number, obtainedAchievements?: number[]){
        this.id = id;
        this.commitCount = commitCount;
        this.reviewCount = reviewCount;
        this.obtainedAchievements = obtainedAchievements;
    }
}
