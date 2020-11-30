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
import { EmailService } from "../services/email.service";
import { MulterModule } from "@nestjs/platform-express";
import { MailerModule } from "@nestjs-modules/mailer";
import { PugAdapter } from "@nestjs-modules/mailer/dist/adapters/pug.adapter";


@Module({
    imports: [
        BackendConfig,
        HttpModule,
        MulterModule.register({
            dest: BackendConfig.IMAGE_STORAGE_PATH
        }),
        MailerModule.forRoot({
            transport: BackendConfig.EMAIL_TRANSPORT,
            template: {
                dir: BackendConfig.EMAIL_TEMPLATES,
                adapter: new PugAdapter(),
                options: {
                    strict: true
                }
            }
        })
    ],
    controllers: [
        UserDatabaseController,
        ProfileImageController,
        AuthenticationController,
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
        EmailService,
        ClientGateway,
        ClientNotificationService,
        { provide: LoggerService, useFactory: () => new LoggerService(BackendConfig.LOG_DEBUG) }
    ]
})
export class AppModule { }
