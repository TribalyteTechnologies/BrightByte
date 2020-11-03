export class Team { 
    public uid: number;
    public name: string;
    public version: number;

    constructor(uid: number, name?: string, version?: number) {
        this.uid = uid;
        this.name = name;
        this.version = version;
    }
}
