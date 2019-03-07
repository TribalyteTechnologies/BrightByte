export class MenuItem { 
    public icon: string; 
    public url: any;
    public pagName: string;
    
    constructor(icon: string, url: any, pagName: string){
        this.icon = icon;
        this.url = url;
        this.pagName = pagName;
    }
}
