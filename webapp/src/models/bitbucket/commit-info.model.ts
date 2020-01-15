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
    public nickname: string;
}

export class ParentInfo {
    public hash: string;
}

export class CommitInfo {
    public hash: string;
    public name: string;
    public date: Date;

    constructor(hash: string, name: string, date: Date){
        this.hash = hash;
        this.name = name;
        this.date = date;
    }
}
