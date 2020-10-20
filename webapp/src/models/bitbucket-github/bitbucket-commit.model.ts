export class BitbucketCommitInfo {
    public hash: string;
    public date: string;
    public message: string;
    public author: BitbucketCommitAuthor;
    public parents: Array<ParentInfo>;
}

export class BitbucketCommitResponse {
    public next: string;
    public values: Array<BitbucketCommitInfo>;
}

export class BitbucketCommitAuthor {
    public user: BitbucketUserInfo;
}

export class BitbucketUserInfo {
    public uuid: string;
}

export class ParentInfo {
    public hash: string;
}
