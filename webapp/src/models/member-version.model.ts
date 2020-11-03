export class MemberVersion { 
    public version: number;
    public teamUids: Array<number>;

    constructor(version: number, teamUids: Array<number>) {
        this.version = version;
        this.teamUids = teamUids;
    }
}
