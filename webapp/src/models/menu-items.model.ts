export class MenuItem { 
    public icon: string; 
    public url: object;
    public pagName: string;
    
    constructor(icon: string, url: object, pagName: string){
        this.icon = icon;
        this.url = url;
        this.pagName = pagName;
    }
}
