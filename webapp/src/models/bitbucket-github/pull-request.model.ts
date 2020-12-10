export class BitbucketPullRequestResponse {
    public values: Array<BitbucketPullResquest>;
    public next: string;
}

export class BitbucketPullResquest {
    public id: number;
    public title: string;
    public author: BitbucketPrAuthor;
    public destination: BitbucketPrDestination;
    public links: BitbucketPrLinks;
    public updated_on: string;
}

export class BitbucketPrAuthor {
    public uuid: string;
}

export class BitbucketPrDestination {
    public commit: BitbucketPrCommitDestination;
}

export class BitbucketPrCommitDestination {
    public hash: string;
}

export class BitbucketPrLinks {
    public commits: BitbucketPrCommitsLinks;
}

export class BitbucketPrCommitsLinks {
    public href: string;
}

export class PullRequest {
    public id: number;
    public title: string;
    public author: BitbucketPrAuthor;
    public commitsHash: Array<string>;
    public destHash: string;
    public date: Date;

    constructor(id: number, title: string, date: Date, destHash: string, author?: BitbucketPrAuthor){
        this.id = id;
        this.title = title;
        this.author = author;
        this.date = date;
        this.commitsHash = new Array<string>();
        this.destHash = destHash;
    }
}

export class BitbucketPrCommitsResponse {
    public next: string;
    public values: Array<PrCommits>;
}

export class PrCommits {
    public hash: string;
}
