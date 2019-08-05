import { Controller, Get, Post, Param } from "@nestjs/common";
import { Observable } from "rxjs";
import { UserDatabaseService } from "../services/user-database.service";
import { AchievementDto } from "src/dto/achievement.dto";
import { ResponseDto } from "src/dto/response/response.dto";

@Controller("database")
export class UserDatabaseController {
    public constructor(private userDatabaseService: UserDatabaseService) { }

    @Get("commits/:id")
    public getCommitNumber(@Param("id") id: string): Observable<ResponseDto> {
        return this.userDatabaseService.getCommitNumber(id);
    }
    @Get("reviews/:id")
    public getReviewNumber(@Param("id") id: string): Observable<ResponseDto> {
        return this.userDatabaseService.getReviewNumber(id);
    }
    @Get("hasAchievement/:userId/:achievementId")
    public hasAchievement(@Param("userId") userId: string, @Param("achievementId") achievementId: string): Observable<ResponseDto> {
        return this.userDatabaseService.hasAchievement(userId, achievementId);
    }
    @Get("achievements/:id")
    public getObtainedAchievements(@Param("id") id: string): Observable<ResponseDto> {
        return this.userDatabaseService.getObtainedAchievements(id);
    }
    @Post("users/:id")
    public createUser(@Param("id") id: string): Observable<ResponseDto> {
        return this.userDatabaseService.createUser(id);
    }
    @Post("commits/:id/:commitNumber")
    public setCommitNumber(@Param("id") id: string, @Param("commitNumber") commitNumber: number): Observable<ResponseDto> {
        return this.userDatabaseService.setCommitNumber(id, commitNumber);
    }
    @Post("reviews/:id/:reviewNumber")
    public setReviewNumber(@Param("id") id: string, @Param("reviewNumber") reviewNumber: number): Observable<ResponseDto> {
        return this.userDatabaseService.setReviewNumber(id, reviewNumber);
    }
    @Post("achievements/:userId/:achievementIds")
    public setObtainedAchievement(@Param("userId") id: string, @Param("achievementIds") achievementIds: string): Observable<ResponseDto> {
        return this.userDatabaseService.setObtainedAchievement(id, achievementIds);
    }
}
