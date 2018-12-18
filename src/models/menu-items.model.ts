export class MenuItem { 
    public icon: string; 
    public url: any;
    public style: string;
    
    constructor(icon: string, url: any, style: string){
        this.icon = icon;
        this.url = url;
        this.style = style;
    }
}
