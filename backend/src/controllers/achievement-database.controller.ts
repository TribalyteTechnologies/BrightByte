import { Controller } from "@nestjs/common";
import { AchievementDatabaseService } from "../services/achievement-database.service";

@Controller("achievements")
export class AchievementDatabaseController {
    public constructor(private achievementDatabaseService: AchievementDatabaseService) { }
}
