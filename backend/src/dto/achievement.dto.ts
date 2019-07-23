export class AchievementDto {
    public id: number;
    public title: string;
    public quantity: number;
    public parameter: string;
    public iconPath: string;

    public constructor(title: string, quantity: number, parameter: string, iconPath: string, id?: number) {
        this.id = id;
        this.title = title;
        this.quantity = quantity;
        this.parameter = parameter;
        this.iconPath = iconPath;
    }
}
