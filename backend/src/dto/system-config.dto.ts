interface IBitbucketConfig {
    workspaces: string[];
}

interface ISeasonConfig {
    durationInMonths: number;
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
