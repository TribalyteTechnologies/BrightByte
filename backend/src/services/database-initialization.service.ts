import { Injectable } from "@nestjs/common";
import { ILogger, LoggerService } from "../logger/logger.service";
import { forkJoin, Observable } from "rxjs";
import { flatMap, tap } from "rxjs/operators";
import { ContractManagerService } from "./contract-manager.service";
import { BackendConfig } from "../backend.config";
import { UserDatabaseService } from "./user-database.service";
import { ReviewEventDto } from "../dto/events/review-event.dto";
import { CommitEventDto } from "../dto/events/commit-event.dto";
import { DispatcherService } from "./dispatcher.service";
import { UserDetailsDto } from "../dto/user-details.dto";

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
        if (BackendConfig.INITIALIZE_USER_DATABASE) {
            this.initializeUsersDatabase().subscribe(result => this.log.d("The result of the initialization is " + result));
        }
    }

    private initializeUsersDatabase(): Observable<Array<boolean>> {
        this.log.d("The database is going to be initialized with data from the Blockchain");
        return this.contractManagerService.getAllUserData().pipe(
        flatMap(users => {
            this.initialUserData = users;
            let obs = this.initialUserData.map(user => 
                this.userDbSrv.initializeNewUser(user.userHash, user.numberOfCommits, user.numReviews)
            );
            return forkJoin(obs);
        }),
        tap(result => this.setInitialAchivements(this.initialUserData)));
    }

    private setInitialAchivements(usersDetails: Array<UserDetailsDto>) {
        usersDetails.forEach(user => {
            let initialCommitEvent = new CommitEventDto(user.userHash, user.numberOfCommits);
            let initialReviewEvent = new ReviewEventDto(user.userHash, user.finishedReviews);
            this.dispatcher.dispatch(initialCommitEvent);
            this.dispatcher.dispatch(initialReviewEvent);
        });
    }
}