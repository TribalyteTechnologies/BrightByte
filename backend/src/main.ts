import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import { BackendConfig } from "src/backend.config";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(BackendConfig.BRIGHTBYTE_DB_PORT);
}
bootstrap();
