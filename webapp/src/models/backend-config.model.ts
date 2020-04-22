export class BackendConfig { 
    public constructor(
        public bitbucketWorkspaces: Array<string>
    ) {
        this.bitbucketWorkspaces = bitbucketWorkspaces;
    }
} 
