import { Component, Input } from "@angular/core";


@Component({
    selector: "achievement",
    templateUrl: "achievement.component.html",
    styles: ["achievement.component.scss"]
 })

export class Achievement {

    @Input()
    public empty = false;

    @Input()
    public achievementInfo: Achievement;

    
}
