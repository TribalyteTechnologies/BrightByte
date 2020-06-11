import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import { BackendConfig } from "./backend.config";
import express from "express";
import { ExpressAdapter } from "@nestjs/platform-express";
import * as fs from "fs";
import { ILogger, LoggerService } from "./logger/logger.service";

class BrightByteCloudBackend {

    private readonly API_PORT = BackendConfig.BRIGHTBYTE_API_PORT;
    private readonly loggerSrv = new LoggerService(true);
    private readonly log: ILogger = this.loggerSrv.get("BrightByteCloudBackend");

    public async launch() {
        const server = express();
        let httpsOptions;
        if (fs.existsSync(BackendConfig.SECRET_SECURE_PATH)) {
            httpsOptions = {
                key: this.readSecretsFile("private.key"),
                cert: this.readSecretsFile("certificate.crt")
            };
            this.log.d("BrightByteCloudBackend will be serve with secure options (https)");
        }
        const applicationOptions = {
            cors: {
                origin: [BackendConfig.WEBAPP_URL]
            },
            httpsOptions: httpsOptions
        };

        const app = await NestFactory.create(AppModule, new ExpressAdapter(server), applicationOptions);
        await app.listen(this.API_PORT);
        this.log.d("BrightByteCloudBackend server listening on port " + this.API_PORT);
    }

    private readSecretsFile(fileName: string): string {
        return fs.readFileSync(BackendConfig.SECRET_SECURE_PATH + fileName, { encoding: "utf8" });
    }
}

new BrightByteCloudBackend().launch();
