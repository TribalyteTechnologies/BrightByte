export class MemberVersion { 
    public version: string;
    public teamUids: Array<number>;

    constructor(version: string, teamUids: Array<number>) {
        this.version = version;
        this.teamUids = teamUids;
    }
}
