export class BackendGithubConfig { 
    public constructor(
        public githubOrganizations: Array<string>
    ) {
        this.githubOrganizations = githubOrganizations;
    }
} 
