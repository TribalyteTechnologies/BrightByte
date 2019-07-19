import { Module } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { UserDatabaseController } from "../controllers/user-database.controller";
import { UserDatabaseService } from "../services/user-database.service";
import { AchievementDatabaseService } from "../services/achievement-database.service";
import { LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import { EventHandlerService } from "../services/eventHandler.service";


@Module({
    imports: [BackendConfig],
    controllers: [UserDatabaseController],
    providers: [UserDatabaseService,
        AchievementDatabaseService,
        Web3Service,
        EventHandlerService,
        { provide: LoggerService, useFactory: () => new LoggerService(BackendConfig.LOG_DEBUG) }
        ] 
})
export class AppModule { }
