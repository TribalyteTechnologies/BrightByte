export class Achievement { 
    public tittle: string;
    public quantity: number; 
    public parameter: string; 
    public iconPath: string;
    public empty: boolean;

    public constructor(empty = true, tittle?: string, quantity?: number, parameter?: string, iconPath?: string){
        this.tittle = tittle;
        this.quantity = quantity;
        this.parameter = parameter;
        this.iconPath = iconPath;
        this.empty = empty;
    }
}
