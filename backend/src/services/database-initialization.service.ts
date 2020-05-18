import { Injectable } from "@nestjs/common";
import { ILogger, LoggerService } from "../logger/logger.service";
import { forkJoin, Observable, of } from "rxjs";
import { flatMap, map, catchError } from "rxjs/operators";
import { ContractManagerService } from "./contract-manager.service";
import { UserDatabaseService } from "./user-database.service";
import { ReviewEventDto } from "../dto/events/review-event.dto";
import { CommitEventDto } from "../dto/events/commit-event.dto";
import { DispatcherService } from "./dispatcher.service";
import { UserDetailsDto } from "../dto/user-details.dto";
import { ResponseDto } from "../dto/response/response.dto";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { FailureResponseDto } from "../dto/response/failure-response.dto";

@Injectable()
export class DatabaseInitializationService {

    private log: ILogger;
    private initialUserData: Array<UserDetailsDto>;

    public constructor(
        loggerSrv: LoggerService,
        private contractManagerService: ContractManagerService,
        private userDbSrv: UserDatabaseService,
        private dispatcher: DispatcherService
    ) {
        this.log = loggerSrv.get("DatabaseInitializationService");
        //this.initializeUsersDatabase().subscribe(result => this.log.d("The result of the initialization is ", result));
    }

    private initializeUsersDatabase(): Observable<any> {
        this.log.d("The database is going to be initialized with data from the Blockchain");
        return this.contractManagerService.getAllUserData().pipe(
            flatMap(users => {
                this.initialUserData = users;
                let obs = this.initialUserData.map(user =>
                    this.userDbSrv.initializeNewUser(user.userHash, "0", user.numberOfCommits, user.finishedReviews)
                );
                return forkJoin(obs);
            }),
            flatMap(res => {
                this.log.d("The users are save ", res);
                return this.contractManagerService.getReviewTimedEvents(this.initialUserData);
            }),
            flatMap((timedEvents: Array<ReviewEventDto>) => {
                return forkJoin(this.setInitialAchivements(this.initialUserData, timedEvents));
            }),
            map(() => {
                this.log.d("The users achivements are set");
                return new SuccessResponseDto("The initialization has been successful");
            }),
            catchError(error => of(new FailureResponseDto(error))));
    }

    private setInitialAchivements(
        usersDetails: Array<UserDetailsDto>,
        timedEventDtos: Array<ReviewEventDto>): Observable<Array<ResponseDto>> {
        let obs = new Array<Observable<ResponseDto>>();
        usersDetails.forEach(user => {
            obs.push(this.dispatcher.dispatch(new CommitEventDto("0", user.userHash, user.numberOfCommits, 0)));
            obs.push(this.dispatcher.dispatch(new ReviewEventDto("0", user.userHash, user.finishedReviews, 0)));
        });
        obs = obs.concat(timedEventDtos.map(event => this.dispatcher.dispatch(event)));
        return forkJoin(obs);
    }
}
