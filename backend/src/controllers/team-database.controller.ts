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

    @Get(":id/members")
    public getTeamMembers(@Param("id") teamUid: string): Observable<ResponseDto> {
        this.log.d("Request to get the member of team: ", teamUid);
        return this.teamDatabaseService.getTeamMembers(teamUid);
    }

    @Get(":id/workspace/:user")
    public getTeamWorkspaces(@Param("id") teamUid: string, @Param("user") user: string): Observable<ResponseDto> {
        this.log.d("Request to get the member workspaces of team: ", teamUid);
        return this.teamDatabaseService.getTeamWorkspaces(teamUid, user);
    }

    @Get(":id/organization/:user")
    public getTeamOrganizations(@Param("id") teamUid: string, @Param("user") user: string): Observable<ResponseDto> {
        this.log.d("Request to get the member organizations of team: ", teamUid);
        return this.teamDatabaseService.getTeamOrganizations(teamUid, user);
    }

    @Post(":id")
    public createTeam(@Param("id") teamUid: string): Observable<ResponseDto> {
        this.log.d("Request to create a new team: ", teamUid);
        return this.teamDatabaseService.createTeam(teamUid);
    }

    @Post(":id/workspace/:workspaceName")
    public addNewWorkspace(@Param("id") teamUid: string, @Param("workspaceName") workspaceName: string): Observable<ResponseDto> {
        this.log.d("Request to add a new workspace to the team: ", teamUid);
        return this.teamDatabaseService.addNewWorkspace(teamUid, workspaceName);
    }

    @Post(":id/organization/:organizationName")
    public addNewOrganization(@Param("id") teamUid: string, @Param("organizationName") organizationName: string): Observable<ResponseDto> {
        this.log.d("Request to add a new organization to the team: ", teamUid);
        return this.teamDatabaseService.addNewOrganization(teamUid, organizationName);
    }

    @Post(":id/members/:user")
    public addNewTeamMember(@Param("id") teamUid: string, @Param("user") user: string): Observable<ResponseDto> {
        this.log.d("Request to add a new member to the team: ", teamUid);
        return this.teamDatabaseService.addNewTeamMember(teamUid, user);
    }

    @Delete(":id/workspace/:workspace")
    public removeWorkspace(@Param("id") teamUid: string, @Param("workspace") workspace: string): Observable<ResponseDto> {
        this.log.d("Request to delete a workspace from the team: ", teamUid);
        return this.teamDatabaseService.removeTeamWorkspace(teamUid, workspace);
    }

    @Delete(":id/organization/:organization")
    public removeOrganization(@Param("id") teamUid: string, @Param("organization") organization: string): Observable<ResponseDto> {
        this.log.d("Request to delete a organization from the team: ", teamUid);
        return this.teamDatabaseService.removeTeamOrganization(teamUid, organization);
    }

    @Delete(":id/members/:user")
    public removeTeamMember(@Param("id") teamUid: string, @Param("user") user: string): Observable<ResponseDto> {
        this.log.d("Request to delete a member from the team: ", teamUid);
        return this.teamDatabaseService.removeTeamMember(teamUid, user);
    }

    @Post(":email/sendInvitation")
    public sendInvitation(@Param("email") userEmail: string): Observable<ResponseDto> {
        this.log.d("Request to send a invitation to participate for user: ", userEmail);
        return this.emailService.sendInvitationEmail(userEmail);
    }
}
