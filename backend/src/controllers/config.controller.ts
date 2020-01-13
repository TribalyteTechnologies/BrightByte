import { Controller, Get } from "@nestjs/common";
import { BackendConfig } from "src/backend.config";

@Controller("config")
export class ConfigController {

    @Get("/")
    public getConfigObj(): Object {
        return BackendConfig.CONFIG_OBJ;
    }
}
