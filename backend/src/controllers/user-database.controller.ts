import { Controller, Get, Param } from "@nestjs/common";
import { Observable } from "rxjs";
import { UserDatabaseService } from "../services/user-database.service";
import { ResponseDto } from "../dto/response/response.dto";

@Controller("database")
export class UserDatabaseController {
    public constructor(private userDatabaseService: UserDatabaseService) { }

    @Get("achievements/:id/:teamUid/:version")
    public getObtainedAchievements(
        @Param("id") id: string, @Param("teamUid") teamUid: string, @Param("version") version: string
    ): Observable<ResponseDto> {
        return this.userDatabaseService.getObtainedAchievements(id, teamUid, version);
    }
}
