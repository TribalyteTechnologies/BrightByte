import { Module, HttpModule } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";
import { UserDatabaseService } from "../services/user-database.service";
import { AchievementDatabaseService } from "../services/achievement-database.service";
import { UserDatabaseController } from "../controllers/user-database.controller";
import { AchievementDatabaseController } from "../controllers/achievement-database.controller";
import { LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import { EventHandlerService } from "../services/event-handler.service";

@Module({
    imports: [BackendConfig,
        HttpModule
    ],
    controllers: [UserDatabaseController,
        AchievementDatabaseController
    ],
    providers: [UserDatabaseService,
        AchievementDatabaseService,
        Web3Service,
        EventHandlerService,
        { provide: LoggerService, useFactory: () => new LoggerService(BackendConfig.LOG_DEBUG) }
    ]
})
export class AppModule { }
