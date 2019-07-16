import { Module } from '@nestjs/common';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';
import { BackendConfig } from 'src/backend.config';
import * as Loki from 'lokijs';

@Module({
	imports: [Loki, BackendConfig],
	controllers: [DatabaseController],
	providers: [DatabaseService],
})
export class DatabaseModule { }
