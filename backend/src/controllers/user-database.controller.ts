import { Controller, Get, Post, Param } from "@nestjs/common";
import { Observable } from "rxjs";
import { UserDatabaseService } from "../services/user-database.service";
import { AchievementDto } from "src/dto/achievement.dto";

@Controller("database")
export class UserDatabaseController {
    public constructor(private userDatabaseService: UserDatabaseService) { }

    @Get("commits/:id")
    public getCommitNumber(@Param("id") id: string): Observable<number> {
        return this.userDatabaseService.getCommitNumber(id);
    }

    @Get("reviews/:id")
    public getReviewNumber(@Param("id") id: string): Observable<number> {
        return this.userDatabaseService.getReviewNumber(id);
    }

    @Get("achievements/:id")
    public getObtainedAchievements(@Param("id") id: string): Observable<AchievementDto[]> {
        return this.userDatabaseService.getObtainedAchievements(id);
    }

    @Get("hasAchievement/:userId/:achievementId")
    public hasAchievement(@Param("userId") userId: string, @Param("achievementId") achievementId: number): Observable<boolean> {
        return this.userDatabaseService.hasAchievement(userId, achievementId);
    }

    @Post("users/:id")
    public createUser(@Param("id") id: string): Observable<string> {
        return this.userDatabaseService.createUser(id);
    }

    @Post("commits/:id/:commitNumber")
    public setCommitNumber(@Param("id") id: string, @Param("commitNumber") commitNumber: number): Observable<string> {
        return this.userDatabaseService.setCommitNumber(id, commitNumber);
    }

    @Post("reviews/:id/:reviewNumber")
    public setReviewNumber(@Param("id") id: string, @Param("reviewNumber") reviewNumber: number): Observable<string> {
        return this.userDatabaseService.setReviewNumber(id, reviewNumber);
    }
    @Post("achievements/:userId/:achievementIds")
    public setObtainedAchievement(@Param("userId") id: string, @Param("achievementIds") achievementIds: string): Observable<string> {
        return this.userDatabaseService.setObtainedAchievement(id, achievementIds);
    }
}
