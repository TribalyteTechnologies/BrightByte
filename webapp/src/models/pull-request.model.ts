export class BitbucketPullRequestResponse {
    public values: Array<BitbucketPullResquest>;
    public next: string;
}

export class BitbucketPullResquest {
    public id: number;
    public title: string;
    public author: BitbucketPRAuthor;
    public destination: BitbucketPRDestination;
    public links: BitbucketPRLinks;
    public updated_on: string;
}

export class BitbucketPRAuthor {
    public nickname: string;
}

export class BitbucketPRDestination {
    public commit: BitbucketPRCommitDestination;
}

export class BitbucketPRCommitDestination {
    public hash: string;
}

export class BitbucketPRLinks {
    public commits: BitbucketPRCommitsLinks;
}

export class BitbucketPRCommitsLinks {
    public href: string;
}

export class PullRequest {
    public id: number;
    public title: string;
    public author: BitbucketPRAuthor;
    public commitsHash: Array<string>;
    public destHash: string;
    public date: Date;

    constructor(id: number, title: string, author: BitbucketPRAuthor, date: Date, destHash: string){
        this.id = id;
        this.title = title;
        this.author = author;
        this.date = date;
        this.commitsHash = new Array<string>();
        this.destHash = destHash;
    }
}

export class BitbucketPRCommitsResponse {
    public next: string;
    public values: Array<PRCommits>;
}

export class PRCommits {
    public hash: string;
}
