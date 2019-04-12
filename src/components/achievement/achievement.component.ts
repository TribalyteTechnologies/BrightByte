import { Component, Input } from "@angular/core";


@Component({
    selector: "achievement",
    templateUrl: "achievement.component.html",
    styles: ["achievement.component.scss"]
 })

export class AchievementComponent {

    @Input()
    public isEmpty = false;

    @Input()
    public achievementInfo: AchievementComponent;

    
}
