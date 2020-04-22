import { Controller, Get, Param, Post } from "@nestjs/common";
import { Observable } from "rxjs";
import { TeamDatabaseService } from "../services/team-database.service";
import { ResponseDto } from "../dto/response/response.dto";

@Controller("team")
export class TeamDatabaseController {
    public constructor(private teamDatabaseService: TeamDatabaseService) { }

    @Get("teamMembers/:id")
    public getTeamMembers(@Param("id") teamUid: number): Observable<ResponseDto> {
        return this.teamDatabaseService.getTeamMembers(teamUid);
    }

    @Get("workspaces/:id")
    public getTeamWorkspacer(@Param("id") teamUid: number): Observable<ResponseDto> {
        return this.teamDatabaseService.getTeamWorkspaces(teamUid);
    }

    @Post("createTeam/:id")
    public createTeam(@Param("id") teamUid: number): Observable<ResponseDto> {
        return this.teamDatabaseService.createTeam(teamUid);
    }

    @Post("addNewWorkspace/:id/:workspace")
    public addNewWorkspace(@Param("id") teamUid: number, @Param("workspace") workspace: string): Observable<ResponseDto> {
        return this.teamDatabaseService.addNewWorkspace(teamUid, workspace);
    }

    @Post("addNewTeamMember/:id/:user")
    public addNewTeamMember(@Param("id") teamUid: number, @Param("user") user: string): Observable<ResponseDto> {
        return this.teamDatabaseService.addNewTeamMember(teamUid, user);
    }
}
