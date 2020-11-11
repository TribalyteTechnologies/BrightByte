export class TeamDto {

    public id: number;
    public teamMembers: Array<string>;
    public workspaces: Array<string>;
    public version: number;
    public organizations: Array<string>;

    public constructor(id: number, version: number) {
        this.id = id;
        this.version = version;
        this.teamMembers = new Array<string>();
        this.workspaces = new Array<string>();
        this.organizations =  new Array<string>();
    }

}
