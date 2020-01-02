export class BitbucketCommitInfo {
    public hash: string;
    public date: string;
    public message: string;
    public author: CommitAuthor;
}

export class BitbucketCommitResponse {
    public next: string;
    public values: Array<BitbucketCommitInfo>;
}

export class CommitAuthor {
    public user: UserInfo;
}

export class UserInfo {
    public nickname: string;
}

export class CommitInfo {
    public hash: string;
    public name: string;
}
