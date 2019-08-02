import { Module } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { UserDatabaseService } from "../services/user-database.service";
import { AchievementDatabaseService } from "../services/achievement-database.service";
import { UserDatabaseController } from "../controllers/user-database.controller";
import { LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import { EventHandlerService } from "../services/event-handler.service";
import { DispatcherService } from "../services/dispatcher.service";
import { EventDatabaseService } from "../services/event-database.service";
import { ClientGateway } from "../gateways/client-gateway";
import { ClientNotificationService } from "../services/client-notfication.service";
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
        ClientGateway,
        ClientNotificationService,
        { provide: LoggerService, useFactory: () => new LoggerService(BackendConfig.LOG_DEBUG) }
    ]
})
export class AppModule { }
