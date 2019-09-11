import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import { BackendConfig } from "./backend.config";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({"origin": BackendConfig.FRONT_ORIGIN_HEADER});
    await app.listen(BackendConfig.BRIGHTBYTE_DB_PORT);
}
bootstrap();
