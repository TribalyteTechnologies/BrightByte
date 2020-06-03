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
        const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
        app.enableCors({ "origin": BackendConfig.WEBAPP_URL });

        await app.init();

        const credentials = {
            key: this.readSecretsFile("private.key"),
            cert: this.readSecretsFile("certificate.crt")
        };
        // HTTP + HTTPS servers
        http.createServer(server).listen(this.DB_PORT);
        https.createServer(credentials, server).listen(this.DB_SECURE_PORT);
    }

    private readSecretsFile(fileName: string): string {
        return fs.readFileSync(`./secrets/${fileName}`, { encoding: "utf8" });
    }
}

new BrightByteCloudBackend().launch();
