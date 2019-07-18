export class AchievementDto { 
    public id: string;
    public title: string;
    public quantity: number; 
    public parameter: string; 
    public iconPath: string;

    public constructor(id: string, title?: string, quantity?: number, parameter?: string, iconPath?: string){
        this.id = id;
        this.title = title;
        this.quantity = quantity;
        this.parameter = parameter;
        this.iconPath = iconPath;
    }
}
