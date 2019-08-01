import { Module } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { UserDatabaseService } from "../services/user-database.service";
import { AchievementDatabaseService } from "../services/achievement-database.service";
import { UserDatabaseController } from "../controllers/user-database.controller";
import { LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import { EventHandlerService } from "../services/event-handler.service";
import { DispatcherService } from "../services/dispatcher.service";
import { EventDatabaseService } from "src/services/event-database.service";
import { CoreDatabaseService } from "src/services/core-database.service";
import { ContractManagerService } from "src/services/contract-manager.service";


@Module({
    imports: [
        BackendConfig
    ],
    controllers: [
        UserDatabaseController       
    ],
    providers: [
        UserDatabaseService,
        AchievementDatabaseService,
        EventDatabaseService,
        CoreDatabaseService,
        Web3Service,
        DispatcherService,
        EventHandlerService,
        ContractManagerService,
        { provide: LoggerService, useFactory: () => new LoggerService(BackendConfig.LOG_DEBUG) }
    ]
})
export class AppModule { }
