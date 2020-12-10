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

export class GithubPullResponse {
    public url: string;
    public id: string;
    public node_id: string;
    public html_url: string;
    public diff_url: string;
    public patch_url: string;
    public issue_url: string;
    public number: number;
    public state: string;
    public locked: boolean;
    public title: string;
    public created_at: Date;
    public commits_url: string;
    public user: any;
}

export class PullRequest {
    public id: number;
    public title: string;
    public author: CommitModelAuthor;
    public commitsHash: Array<string>;
    public destHash: string;
    public date: Date;

    constructor(id: number, title: string, author: CommitModelAuthor, date: Date, destHash: string){
        this.id = id;
        this.title = title;
        this.author = author;
        this.date = date;
        this.commitsHash = new Array<string>();
        this.destHash = destHash;
    }
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
