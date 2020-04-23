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
    private initObs: Observable<Loki.Collection>;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private databaseSrv: CoreDatabaseService
    ) {
        this.log = loggerSrv.get("TeamDatabaseService");
        this.init();
    }

    public getTeamWorkspaces(teamUid: number, user: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: teamUid })),
            map((team: TeamDto) => 
            team.teamMembers.indexOf(user) !== -1 ? new SuccessResponseDto(team.workspaces) : new SuccessResponseDto(new Array<string>())),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }

    public getTeamMembers(teamUid: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            map(collection => collection.findOne({ id: teamUid })),
            map((team: TeamDto) => new SuccessResponseDto(team.teamMembers)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_FAILURE)))
        );
    }
    
    public createTeam(teamUid: number): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let team = collection.findOne({ id: teamUid });
                let ret;
                if (team) {
                    ret = of(true);
                } else {
                    team = collection.insert(new TeamDto(teamUid));
                    ret = this.databaseSrv.save(this.database, collection, team);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto(created)),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public addNewWorkspace(teamUid: number, workspace: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let team = collection.findOne({ id: teamUid });
                if (team) {
                    team.workspaces.indexOf(workspace) === -1 ? team.workspaces.push(workspace) : this.log.d("This item already exists");
                    ret = this.databaseSrv.save(this.database, collection, team);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public addNewTeamMember(teamUid: number, user: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let team = collection.findOne({ id: teamUid });
                if (team) {
                    team.teamMembers.indexOf(user) === -1 ? team.teamMembers.push(user) : this.log.d("This item already exists");
                    ret = this.databaseSrv.save(this.database, collection, team);
                } else {
                    let newTeam = new TeamDto(teamUid);
                    newTeam.teamMembers.push(user);
                    team = collection.insert(newTeam);
                    ret = this.databaseSrv.save(this.database, collection, team);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public removeTeamWorkspace(teamUid: number, workspace: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let team = collection.findOne({ id: teamUid });
                if (team) {
                    let workspaceIndex = team.workspaces.indexOf(workspace);
                    workspaceIndex === -1 ? this.log.d("The workspace did not exists") : team.workspaces.splice(workspaceIndex, 1);
                    ret = this.databaseSrv.save(this.database, collection, team);
                }
                return ret;
            }),
            map(created => new SuccessResponseDto()),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public removeTeamMember(teamUid: number, user: string): Observable<ResponseDto> {
        return this.initObs.pipe(
            flatMap(collection => {
                let ret: Observable<string> = throwError(BackendConfig.STATUS_FAILURE);
                let team = collection.findOne({ id: teamUid });
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
            flatMap(database => this.databaseSrv.initCollection(database, BackendConfig.TEAMS_COLLECTION)),
            first(),
            shareReplay(BackendConfig.BUFFER_SIZE)
        );
    }
}
