interface IBitbucketConfig {
    workspaces: Array<string>;
}

export class SystemConfigDto {
    public constructor(
        public bitbucket: IBitbucketConfig
    ) {
        this.bitbucket = bitbucket;
    }
} 
