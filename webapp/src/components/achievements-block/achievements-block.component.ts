import { Component, Input } from "@angular/core";
import { Achievement } from "../../models/achievement.model";


@Component({
    selector: "achievements-block",
    templateUrl: "achievements-block.component.html",
    styles: ["achievements-block.component.scss"]
 })

export class AchievementsBlockComponent {

    @Input()
    public achievementsUnlocked = new Array<Achievement>();

    @Input()
    public isPageLoaded = false;

    public rows: Array<number>;
    
    public readonly NUMBER_OF_ROWS = 4;
    public readonly NUMBER_OF_COLUMNS = 4;

    public ngOnInit(){
        this.rows = Array.from({length: this.NUMBER_OF_ROWS}, (value, index) => index);
    }

    public columns(rowIndex: number): Array<number> {
        let row = Array.from({length: this.NUMBER_OF_COLUMNS}, (value, index) => index);
        return Array.from(row, x => x + this.NUMBER_OF_COLUMNS * rowIndex);
    }
}
