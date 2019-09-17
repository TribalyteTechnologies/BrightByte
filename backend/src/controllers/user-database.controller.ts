import { Controller, Get, Param } from "@nestjs/common";
import { Observable } from "rxjs";
import { UserDatabaseService } from "../services/user-database.service";
import { ResponseDto } from "../dto/response/response.dto";

@Controller("database")
export class UserDatabaseController {
    public constructor(private userDatabaseService: UserDatabaseService) { }

    @Get("achievements/:id")
    public getObtainedAchievements(@Param("id") id: string): Observable<ResponseDto> {
        return this.userDatabaseService.getObtainedAchievements(id);
    }
}
