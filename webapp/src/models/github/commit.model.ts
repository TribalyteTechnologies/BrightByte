export class GithubCommitResponse {
    public sha: string;
    public node_id: string;
    public commit: Commit;
    public url: string;
    public html_url: string;
    public comments_url: string;
    public author: CommitModelAuthor;
    public committer: CommitModelAuthor;
    public parents: Parent[];
}

export class CommitModelAuthor {
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

export class Commit {
    public author: CommitAuthor;
    public committer: CommitAuthor;
    public message: string;
    public tree: Tree;
    public url: string;
    public comment_count: number;
    public verification: Verification;
}

export class CommitAuthor {
    public name: string;
    public email: string;
    public date: string;
}

export class Tree {
    public sha: string;
    public url: string;
}

export class Verification {
    public verified:  boolean;
    public reason:    string;
    public signature: null;
    public payload:   null;
}

export class Parent {
    public sha:      string;
    public url:      string;
    public html_url: string;
}
