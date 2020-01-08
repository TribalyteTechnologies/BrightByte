import { CommitInfo } from "./commit-info.model";

export class Repository {
    public slug: string;
    public name: string;
    public commitsInfo: Array<CommitInfo>;
    public numCommits: number;
    public isReadAllCommits: boolean;
}
