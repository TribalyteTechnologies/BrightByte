export class BackendBitbucketConfig { 
    public constructor(
        public bitbucketWorkspaces: Array<string>
    ) {
        this.bitbucketWorkspaces = bitbucketWorkspaces;
    }
} 
