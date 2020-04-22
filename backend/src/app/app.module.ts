import { Module, HttpModule } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { UserDatabaseService } from "../services/user-database.service";
import { TeamDatabaseService } from "../services/team-database.service";
import { AchievementDatabaseService } from "../services/achievement-database.service";
import { UserDatabaseController } from "../controllers/user-database.controller";
import { ProfileImageController } from "../controllers/profile-image.controller";
import { AuthenticationController } from "../controllers/authentication.controller";
import { TeamDatabaseController } from "../controllers/team-database.controller";
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
import { ServeStaticModule } from "@nestjs/serve-static";
import { SystemConfigController } from "../controllers/system-config.controller";


@Module({
    imports: [
        BackendConfig,
        HttpModule,
        MulterModule.register({
            dest: BackendConfig.IMAGE_STORAGE_PATH
        }),
        ServeStaticModule.forRoot({
            rootPath: BackendConfig.STATIC_FILES_PATH
        })
    ],
    controllers: [
        UserDatabaseController,
        ProfileImageController,
        AuthenticationController,
        SystemConfigController,
        TeamDatabaseController
    ],
    providers: [
        UserDatabaseService,
        AchievementDatabaseService,
        EventDatabaseService,
        CoreDatabaseService,
        TeamDatabaseService,
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
