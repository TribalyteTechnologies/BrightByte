export class Achievement { 
    public title: string;
    public quantity: number; 
    public parameter: string; 
    public iconPath: string;
    public isEmpty: boolean;

    public constructor(isEmpty = true, title?: string, quantity?: number, parameter?: string, iconPath?: string){
        this.title = title;
        this.quantity = quantity;
        this.parameter = parameter;
        this.iconPath = iconPath;
        this.isEmpty = isEmpty;
    }
}
