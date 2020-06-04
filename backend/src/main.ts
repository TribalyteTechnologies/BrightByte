import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import { BackendConfig } from "./backend.config";
import express from "express";
import { ExpressAdapter } from "@nestjs/platform-express";
import * as fs from "fs";
import http from "http";
import https from "https";

class BrightByteCloudBackend {

    private readonly DB_PORT = BackendConfig.BRIGHTBYTE_DB_PORT;
    private readonly DB_SECURE_PORT = BackendConfig.BRIGHTBYTE_DB_SECURE_PORT;

    public async launch() {
        const server = express();
        let httpsOptions;
        if (fs.existsSync(BackendConfig.SECRET_SECURE_PATH)) {
            httpsOptions = {
                key: this.readSecretsFile("private.key"),
                cert: this.readSecretsFile("certificate.crt")
            };
        }
        const applicationOptions = {
            cors: {
                origin: [BackendConfig.WEBAPP_URL]
            },
            httpsOptions: httpsOptions
        };

        const app = await NestFactory.create(AppModule, new ExpressAdapter(server), applicationOptions);
        await app.listen(this.DB_PORT);
    }

    private readSecretsFile(fileName: string): string {
        return fs.readFileSync(BackendConfig.SECRET_SECURE_PATH + fileName, { encoding: "utf8" });
    }
}

new BrightByteCloudBackend().launch();
