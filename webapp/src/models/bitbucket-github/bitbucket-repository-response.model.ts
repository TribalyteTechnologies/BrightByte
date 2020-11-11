export class BitbucketRepositoryResponse {
    public values: Array<BitbucketRepository>;
    public next: string;
}

export class BitbucketRepository {
    public slug: string;
    public name: string;
}
