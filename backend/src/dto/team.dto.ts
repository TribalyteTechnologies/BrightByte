export class TeamDto {

    public id: number;
    public teamMembers: Array<string>;
    public workspaces: Array<string>;

    public constructor(id: number) {
        this.id = id;
        this.teamMembers = new Array<string>();
        this.workspaces = new Array<string>();
    }

}
