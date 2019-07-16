import { NestFactory } from "@nestjs/core";
import { DatabaseModule } from "./database/database.module";
import { BackendConfig } from "src/backend.config"

async function bootstrap() {
	const app = await NestFactory.create(DatabaseModule);
	await app.listen(BackendConfig.BRIGHTBYTE_DB_PORT);
	console.log("Listening on port " + BackendConfig.BRIGHTBYTE_DB_PORT + ".");
}
bootstrap();
