export class TeamDto {

    public id: string;
    public teamMembers: Array<string>;
    public workspaces: Array<string>;
    public organizations: Array<string>;

    public constructor(id: string) {
        this.id = id;
        this.teamMembers = new Array<string>();
        this.workspaces = new Array<string>();
        this.organizations =  new Array<string>();
    }

}
