export class TeamDto {

    public id: string;
    public teamMembers: Array<string>;
    public workspaces: Array<string>;
    public version: string;

    public constructor(id: string, version: string) {
        this.id = id;
        this.version = version;
        this.teamMembers = new Array<string>();
        this.workspaces = new Array<string>();
    }

}
