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
    public numPRs: number;
    public numPRsNotUploaded: number;
    public isReadAllCommits: boolean;

    constructor(slug: string, name: string) {
        this.slug = slug;
        this.name = name;
        this.numCommits = 0;
        this.numPRs = 0;
        this.numPRsNotUploaded = 0;
    }
}
