import { Component, Input } from "@angular/core";
import { AppConfig } from "../../app.config";
import { Achievement } from "../../models/achievement.model";


@Component({
    selector: "achievement",
    templateUrl: "achievement.component.html",
    styles: ["achievement.component.scss"]
 })

export class AchievementComponent {

    public timedReviewType = AppConfig.AchievementType.TimedReview;

    @Input()
    public isEmpty = false;

    @Input()
    public achievementInfo: Achievement;

    @Input()
    public isBig = false;
}
