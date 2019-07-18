import { Controller, Get, Post, Param } from "@nestjs/common";
import { Observable } from "rxjs";
import { UserDatabaseService } from "./user-database.service";

@Controller("database")
export class UserDatabaseController {
    public constructor(private databaseService: UserDatabaseService) { }

    @Get("commits/:id")
    public getCommitNumber(@Param("id") id: string): Observable<number> {
        return this.databaseService.getCommitNumber(id);
    }

    @Get("reviews/:id")
    public getReviewNumber(@Param("id") id: string): Observable<number> {
        return this.databaseService.getReviewNumber(id);
    }

    @Post("users/:id")
    public createUser(@Param("id") id: string): Observable<string> {
        return this.databaseService.createUser(id);
    }

    @Post("commits/:id/:commitNumber")
    public setCommitNumber(@Param("id") id: string, @Param("commitNumber") commitNumber: number): Observable<string> {
        return this.databaseService.setCommitNumber(id, commitNumber);
    }

    @Post("reviews/:id/:reviewNumber")
    public setReviewNumber(@Param("id") id: string, @Param("reviewNumber") reviewNumber: number): Observable<string> {
        return this.databaseService.setReviewNumber(id, reviewNumber);

    }
}
