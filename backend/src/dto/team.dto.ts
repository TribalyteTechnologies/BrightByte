export class TeamDto {

    public id: string;
    public teamMembers: Array<string>;
    public workspaces: Array<string>;
    public version: number;

    public constructor(id: string, version: number) {
        this.id = id;
        this.version = version;
        this.teamMembers = new Array<string>();
        this.workspaces = new Array<string>();
    }

}
