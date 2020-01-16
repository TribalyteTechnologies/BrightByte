import { Controller, Get } from "@nestjs/common";
import { BackendConfig } from "../backend.config";

@Controller("config")
export class ConfigController {

    @Get("/")
    public getConfigObj(): Object {
        return BackendConfig.SYSTEM_CONFIGURATION;
    }
}
