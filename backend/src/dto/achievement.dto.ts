export class AchievementDto {
    public constructor(
        public title: string,
        public quantity: number,
        public parameter: string,
        public iconPath: string,
        public id?: number
        ) { }
}
