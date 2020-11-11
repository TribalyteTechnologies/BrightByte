import { CommitInfo } from "./commit-info.model";
import { PullRequest } from "./pull-request.model";

export class Repository {
    public slug: string;
    public name: string;
    public commitsInfo: Array<CommitInfo>;
    public numCommits: number;
    public pullRequests?: Array<PullRequest>;
    public pullRequestsNotUploaded?: Array<PullRequest>;
    public numPrs?: number;
    public numPrsNotUploaded?: number;
    public isReadAllCommits: boolean;
    public workspace?: string;
    public organization?: string;
    public provider: string;

    constructor(slug: string, name: string, workspace?: string, organization?: string) {
        this.slug = slug;
        this.name = name;
        this.workspace = workspace;
        this.organization = organization;
        this.numCommits = 0;
        this.numPrs = 0;
        this.numPrsNotUploaded = 0;
        this.commitsInfo = new Array<CommitInfo>();
        this.pullRequests = new Array<PullRequest>();
        this.pullRequestsNotUploaded = new Array<PullRequest>();
        this.provider = "";
    }
}
