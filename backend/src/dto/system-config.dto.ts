interface IBitbucketConfig {
    workspaces: Array<string>;
}

interface ISeasonConfig {
    durationInDays: number;
}

export class SystemConfigDto {
    public constructor(
        public bitbucket: IBitbucketConfig,
        public season: ISeasonConfig
    ) {
        this.bitbucket = bitbucket;
        this.season = season;
    }
} 
