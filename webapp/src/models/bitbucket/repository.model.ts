import { CommitInfo } from "./commit-info.model";
import { PullRequest } from "./pull-request.model";

export class BitbucketRepositoryResponse {
    public values: Array<BitbucketRepository>;
    public next: string;
}

export class BitbucketRepository {
    public slug: string;
    public name: string;
}

export class Repository {
    public slug: string;
    public name: string;
    public commitsInfo: Array<CommitInfo>;
    public numCommits: number;
    public pullRequests: Array<PullRequest>;
    public pullRequestsNotUploaded: Array<PullRequest>;
    public numPrs: number;
    public numPrsNotUploaded: number;
    public isReadAllCommits: boolean;
    public workspace: string;

    constructor(slug: string, name: string, workspace: string) {
        this.slug = slug;
        this.name = name;
        this.workspace = workspace;
        this.numCommits = 0;
        this.numPrs = 0;
        this.numPrsNotUploaded = 0;
        this.commitsInfo = new Array<CommitInfo>();
        this.pullRequests = new Array<PullRequest>();
        this.pullRequestsNotUploaded = new Array<PullRequest>();
    }
}
