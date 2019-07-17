import { Module } from '@nestjs/common';
import { BackendConfig } from 'src/backend.config';
import { DatabaseController } from "./database/database.controller";
import { DatabaseService } from "./database/database.service";
import { LoggerService } from "./logger/logger.service";
import * as Loki from 'lokijs';


@Module({
    imports: [BackendConfig, Loki],
    controllers: [DatabaseController],
    providers: [DatabaseService, 
        { provide: LoggerService, useFactory: () => new LoggerService(BackendConfig.LOG_DEBUG) }
        ] 
})
export class AppModule { }
