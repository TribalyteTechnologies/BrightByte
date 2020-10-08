export class Team { 
    public uid: number;
    public name: string;
    public version: string;

    constructor(uid: number, name?: string, version?: string) {
        this.uid = uid;
        this.name = name;
        this.version = version;
    }
}
