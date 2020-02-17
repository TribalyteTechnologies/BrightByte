interface IBitbucketConfig {
    workspaces: string[];
}

export class BackendConfig { 
    public constructor(
        public bitbucket: IBitbucketConfig
    ) {
        this.bitbucket = bitbucket;
    }
} 
