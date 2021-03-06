import { Component, Input } from "@angular/core";
import { Achievement } from "../../models/achievement.model";


@Component({
    selector: "achievement",
    templateUrl: "achievement.component.html",
    styles: ["achievement.component.scss"]
 })

export class AchievementComponent {

    @Input()
    public isEmpty = false;

    @Input()
    public achievementInfo: Achievement;

    @Input()
    public isBig = false;
}
