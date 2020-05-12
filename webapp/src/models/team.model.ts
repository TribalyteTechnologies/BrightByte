export class Team { 
    public uid: number;
    public name: string;

    constructor(uid: number, name?: string) {
        this.uid = uid;
        this.name = name;
    }
}
