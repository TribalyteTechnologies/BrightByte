export class GithubRepositoryResponse {
    public id: number;
    public node_id: string;
    public name: string;
    public full_name: string;
    public private: boolean;
    public owner: Owner;
    public html_url: string;
    public description: null;
    public fork: boolean;
    public url: string;
    public forks_url: string;
    public keys_url: string;
    public collaborators_url: string;
    public teams_url: string;
    public hooks_url: string;
    public issue_events_url: string;
    public events_url: string;
    public assignees_url: string;
    public branches_url: string;
    public tags_url: string;
    public blobs_url: string;
    public git_tags_url: string;
    public git_refs_url: string;
    public trees_url: string;
    public statuses_url: string;
    public languages_url: string;
    public stargazers_url: string;
    public contributors_url: string;
    public subscribers_url: string;
    public subscription_url: string;
    public commits_url: string;
    public git_commits_url: string;
    public comments_url: string;
    public issue_comment_url: string;
    public contents_url: string;
    public compare_url: string;
    public merges_url: string;
    public archive_url: string;
    public downloads_url: string;
    public issues_url: string;
    public pulls_url: string;
    public milestones_url: string;
    public notifications_url: string;
    public labels_url: string;
    public releases_url: string;
    public deployments_url: string;
    public created_at: string;
    public updated_at: string;
    public pushed_at: string;
    public git_url: string;
    public ssh_url: string;
    public clone_url: string;
    public svn_url: string;
    public homepage: null;
    public size: number;
    public stargazers_count: number;
    public watchers_count: number;
    public language: null | string;
    public has_issues: boolean;
    public has_projects: boolean;
    public has_downloads: boolean;
    public has_wiki: boolean;
    public has_pages: boolean;
    public forks_count: number;
    public mirror_url: null;
    public archived: boolean;
    public disabled: boolean;
    public open_issues_count: number;
    public license: null;
    public forks: number;
    public open_issues: number;
    public watchers: number;
    public default_branch: string;
    public permissions: Permissions;
}

export class Owner {
    public login: string;
    public id: number;
    public node_id: string;
    public avatar_url: string;
    public gravatar_id: string;
    public url: string;
    public html_url: string;
    public followers_url: string;
    public following_url: string;
    public gists_url: string;
    public starred_url: string;
    public subscriptions_url: string;
    public organizations_url: string;
    public repos_url: string;
    public events_url: string;
    public received_events_url: string;
    public type: string;
    public site_admin: boolean;
}

export class Permissions {
    public admin: boolean;
    public push: boolean;
    public pull: boolean;
}

export class GithubEventsResponse {
    public values: Array<GithubEvent>;
}

export class GithubEvent {
    public id: number;
    public type: string;
    public created_at: string;
    public public: boolean;
    public actor: any;
    public payload: any;
    public repo: any;
}


export class CommitInfo {
    public hash: string;
    public name: string;
    public repoUrl: string;

    constructor(hash: string, name: string, repoUrl: string) {
        this.hash = hash;
        this.name = name;
        this.repoUrl = repoUrl;
    }
}


export class GithubRepository {
    public name: string;
    public repoUrl: string;
    public commitsInfo: Array<CommitInfo>;
    public isReadAllCommits: boolean;

    constructor(name: string, repoUrl: string) {
        this.name = name;
        this.repoUrl = repoUrl;
        this.commitsInfo = new Array<CommitInfo>();
    }

}
