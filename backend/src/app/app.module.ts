import { Module, HttpModule } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { UserDatabaseService } from "../services/user-database.service";
import { AchievementDatabaseService } from "../services/achievement-database.service";
import { UserDatabaseController } from "../controllers/user-database.controller";
import { ProfileImageController } from "../controllers/profile-image.controller";
import { LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import { EventHandlerService } from "../services/event-handler.service";
import { DispatcherService } from "../services/dispatcher.service";
import { EventDatabaseService } from "../services/event-database.service";
import { ClientGateway } from "../gateways/client-gateway";
import { ClientNotificationService } from "../services/client-notfication.service";
import { CoreDatabaseService } from "../services/core-database.service";
import { ContractManagerService } from "../services/contract-manager.service";
import { DatabaseInitializationService } from "../services/database-initialization.service";
import { MulterModule } from "@nestjs/platform-express";


@Module({
    imports: [
        BackendConfig,
        HttpModule,
        MulterModule.register({
            dest: "./public"
        })
    ],
    controllers: [
        UserDatabaseController,
        ProfileImageController     
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
        DatabaseInitializationService,
        { provide: LoggerService, useFactory: () => new LoggerService(BackendConfig.LOG_DEBUG) }
    ]
})
export class AppModule { }
