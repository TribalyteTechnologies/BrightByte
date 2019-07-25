import { Controller, Get, Param } from "@nestjs/common";
import { Observable } from "rxjs";
import { AchievementDatabaseService } from "../services/achievement-database.service";
import { AchievementDto } from "src/dto/achievement.dto";

@Controller("achievements")
export class AchievementDatabaseController {
    public constructor(private achievementDatabaseService: AchievementDatabaseService) { }

    @Get(":ids")
    public getAchievement(@Param("ids") ids: string): Observable<AchievementDto[]> {
        return this.achievementDatabaseService.getAchievements(ids);
    }
}
