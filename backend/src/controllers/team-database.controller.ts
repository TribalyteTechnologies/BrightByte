import { Controller, Get, Param, Post } from "@nestjs/common";
import { Observable } from "rxjs";
import { TeamDatabaseService } from "../services/team-database.service";
import { ResponseDto } from "../dto/response/response.dto";

@Controller("team")
export class TeamDatabaseController {
    public constructor(private teamDatabaseService: TeamDatabaseService) { }

    @Get("teamMembers/:id")
    public getTeamMembers(@Param("id") teamUid: string): Observable<ResponseDto> {
        return this.teamDatabaseService.getTeamMembers(teamUid);
    }

    @Get("teamWorkspaces/:id/:user")
    public getTeamWorkspaces(@Param("id") teamUid: string, @Param("user") user: string): Observable<ResponseDto> {
        return this.teamDatabaseService.getTeamWorkspaces(teamUid, user);
    }

    @Post("createTeam/:id")
    public createTeam(@Param("id") teamUid: string): Observable<ResponseDto> {
        return this.teamDatabaseService.createTeam(teamUid);
    }

    @Post("addNewWorkspace/:id/:workspace")
    public addNewWorkspace(@Param("id") teamUid: string, @Param("workspace") workspace: string): Observable<ResponseDto> {
        return this.teamDatabaseService.addNewWorkspace(teamUid, workspace);
    }

    @Post("addNewTeamMember/:id/:user")
    public addNewTeamMember(@Param("id") teamUid: string, @Param("user") user: string): Observable<ResponseDto> {
        return this.teamDatabaseService.addNewTeamMember(teamUid, user);
    }

    @Post("removeTeamWorkspace/:id/:workspace")
    public removeWorkspace(@Param("id") teamUid: string, @Param("workspace") workspace: string): Observable<ResponseDto> {
        return this.teamDatabaseService.removeTeamWorkspace(teamUid, workspace);
    }

    @Post("removeTeamMember/:id/:user")
    public removeTeamMember(@Param("id") teamUid: string, @Param("user") user: string): Observable<ResponseDto> {
        return this.teamDatabaseService.removeTeamMember(teamUid, user);
    }
}
