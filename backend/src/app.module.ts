import { Module } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { UserDatabaseController } from "./database/user-database.controller";
import { UserDatabaseService } from "./database/user-database.service";
import { LoggerService } from "./logger/logger.service";
import * as Loki from "lokijs";


@Module({
    imports: [BackendConfig, Loki],
    controllers: [UserDatabaseController],
    providers: [UserDatabaseService, 
        { provide: LoggerService, useFactory: () => new LoggerService(BackendConfig.LOG_DEBUG) }
        ] 
})
export class AppModule { }
