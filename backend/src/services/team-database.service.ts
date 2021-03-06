import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { Observable, throwError, of } from "rxjs";
import { flatMap, tap, map, first, catchError, shareReplay } from "rxjs/operators";
import { TeamDto } from "../dto/team.dto";
import Loki from "lokijs";
import { ILogger, LoggerService } from "../logger/logger.service";
import { CoreDatabaseService } from "./core-database.service";
import { ResponseDto } from "../dto/response/response.dto";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { FailureResponseDto } from "../dto/response/failure-response.dto";

@Injectable()
export class TeamDatabaseService {

    private database: Loki;
    private initObs: Observable<Loki.Collection<TeamDto>>;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private databaseSrv: CoreDatabaseService
    ) {
        this.log = loggerSrv.get("TeamDatabaseService");
        this.init();
    }

    public getTeamWorkspaces(teamUid: number, user: string, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: teamUid, version: version }) as TeamDto),
            map((team: TeamDto) => 
            team.teamMembers.indexOf(user) !== -1 ? new SuccessResponseDto(team.workspaces) : new SuccessResponseDto(new Array<string>())),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public getTeamOrganizations(teamUid: number, user: string, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: teamUid, version: version }) as TeamDto),
            map((team: TeamDto) => 
            team.teamMembers.indexOf(user) !== -1 ? new SuccessResponseDto(team.organizations) : 
            new SuccessResponseDto(new Array<string>())),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public getTeamMembers(teamUid: number, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: teamUid, version: version }) as TeamDto),
            map((team: TeamDto) => new SuccessResponseDto(team.teamMembers)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }
    
    public createTeam(teamUid: number, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let team = collection.findOne({ id: teamUid, version: version }) as TeamDto;
                let ret: Observable<string>;
                if (team) {
                    ret = throwError(BackendConfig.STATUS_FAILURE);
                } else {
                    team = collection.insert(new TeamDto(teamUid, version)) as TeamDto;
                    ret = this.databaseSrv.save(this.database, collection, team);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto(created)),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public addNewWorkspace(teamUid: number, workspace: string, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let team = collection.findOne({ id: teamUid, version: version }) as TeamDto;
                if (team && team.workspaces && team.workspaces.indexOf(workspace) < 0) {
                    team.workspaces.push(workspace);
                    ret = this.databaseSrv.save(this.database, collection, team);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public addNewOrganization(teamUid: number, organization: string, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let team = collection.findOne({ id: teamUid, version: version }) as TeamDto;
                if (team && team.organizations && team.organizations.indexOf(organization) < 0) {
                    team.organizations.push(organization);
                    ret = this.databaseSrv.save(this.database, collection, team);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public addNewTeamMember(teamUid: number, user: string, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let team = collection.findOne({ id: teamUid, version: version }) as TeamDto;
                if (team) {
                    team.teamMembers.indexOf(user) === -1 ? team.teamMembers.push(user) : this.log.d("This item already exists");
                } else {
                    let newTeam = new TeamDto(teamUid, version);
                    newTeam.teamMembers.push(user);
                    team = collection.insert(newTeam) as TeamDto;
                }
                return this.databaseSrv.save(this.database, collection, team);
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public removeTeamWorkspace(teamUid: number, workspace: string, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let team = collection.findOne({ id: teamUid, version: version }) as TeamDto;
                if (team) {
                    let workspaceIndex = team.workspaces.indexOf(workspace);
                    workspaceIndex < 0 ? this.log.d("The workspace did not exists") : team.workspaces.splice(workspaceIndex, 1);
                    ret = this.databaseSrv.save(this.database, collection, team);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public removeTeamOrganization(teamUid: number, organization: string, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let team = collection.findOne({ id: teamUid, version: version }) as TeamDto;
                if (team) {
                    let organizationIndex = team.organizations.indexOf(organization);
                    organizationIndex < 0 ? this.log.d("The organization did not exists") : 
                    team.organizations.splice(organizationIndex, 1);
                    ret = this.databaseSrv.save(this.database, collection, team);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public removeTeamMember(teamUid: number, user: string, version: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let team = collection.findOne({ id: teamUid, version: version }) as TeamDto;
                if (team) {
                    let userIndex = team.teamMembers.indexOf(user);
                    userIndex === -1 ? this.log.d("The user did not exists") : team.teamMembers.splice(userIndex, 1);
                    ret = this.databaseSrv.save(this.database, collection, team);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    private init() {
        this.initObs = this.databaseSrv.initDatabase(BackendConfig.TEAMS_DB_JSON).pipe(
            tap(database => this.database = database),
            flatMap(database => this.databaseSrv.initCollection<TeamDto>(database, BackendConfig.TEAMS_COLLECTION)),
            first(),
            shareReplay(BackendConfig.BUFFER_SIZE)
        );
    }
}
