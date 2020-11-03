import { Controller, Get, Param, Post, Delete} from "@nestjs/common";
import { Observable } from "rxjs";
import { TeamDatabaseService } from "../services/team-database.service";
import { ResponseDto } from "../dto/response/response.dto";
import { ILogger, LoggerService } from "../logger/logger.service";
import { EmailService } from "../services/email.service";


@Controller("team")
export class TeamDatabaseController {

    private log: ILogger;
    public constructor(
        private teamDatabaseService: TeamDatabaseService,
        private emailService: EmailService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("TeamDatabaseController");
    }

    @Get(":id/:version/members")
    public getTeamMembers(@Param("id") teamUid: string, @Param("version") version: number): Observable<ResponseDto> {
        this.log.d("Request to get the member of team: ", teamUid);
        return this.teamDatabaseService.getTeamMembers(teamUid, version);
    }

    @Get(":id/:version/workspace/:user")
    public getTeamWorkspaces(
        @Param("id") teamUid: string, @Param("version") version: number, @Param("user") user: string): Observable<ResponseDto> {
        this.log.d("Request to get the member workspaces of team: ", teamUid);
        return this.teamDatabaseService.getTeamWorkspaces(teamUid, user, version);
    }

    @Post(":id/:version")
    public createTeam(@Param("id") teamUid: string, @Param("version") version: number): Observable<ResponseDto> {
        this.log.d("Request to create a new team: ", teamUid);
        return this.teamDatabaseService.createTeam(teamUid, version);
    }

    @Post(":id/:version/workspace/:workspaceName")
    public addNewWorkspace(
        @Param("id") teamUid: string, @Param("version") version: number, @Param("workspaceName") workspaceName: string)
        : Observable<ResponseDto> {
        this.log.d("Request to add a new workspace to the team: ", teamUid);
        return this.teamDatabaseService.addNewWorkspace(teamUid, workspaceName, version);
    }

    @Post(":id/:version/members/:user")
    public addNewTeamMember(
        @Param("id") teamUid: string, @Param("version") version: number, @Param("user") user: string
    ): Observable<ResponseDto> {
        this.log.d("Request to add a new member to the team: ", teamUid);
        return this.teamDatabaseService.addNewTeamMember(teamUid, user, version);
    }

    @Delete(":id/:version/workspace/:workspace")
    public removeWorkspace(
        @Param("id") teamUid: string, @Param("version") version: number, @Param("workspace") workspace: string
    ): Observable<ResponseDto> {
        this.log.d("Request to delete a workspace from the team: ", teamUid);
        return this.teamDatabaseService.removeTeamWorkspace(teamUid, workspace, version);
    }

    @Delete(":id/:version/members/:user")
    public removeTeamMember(
        @Param("id") teamUid: string, @Param("user") user: string, @Param("version") version: number
    ): Observable<ResponseDto> {
        this.log.d("Request to delete a member from the team: ", teamUid);
        return this.teamDatabaseService.removeTeamMember(teamUid, user, version);
    }

    @Post(":email/sendInvitation")
    public sendInvitation(@Param("email") userEmail: string): Observable<ResponseDto> {
        this.log.d("Request to send a invitation to participate for user: ", userEmail);
        return this.emailService.sendInvitationEmail(userEmail);
    }
}
