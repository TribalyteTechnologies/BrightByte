import { Controller, Get } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { SystemConfigDto } from "src/dto/system-config.dto";

@Controller("config")
export class SystemConfigController {

    @Get("/")
    public getConfigObj(): SystemConfigDto {
        return BackendConfig.SYSTEM_CONFIGURATION;
    }
}
