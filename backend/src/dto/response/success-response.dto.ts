import { ResponseDto } from "./response.dto";
import { BackendConfig } from "../../backend.config";

export class SuccessResponseDto extends ResponseDto {
    public constructor(data?: any) {
        super();
        this.status = BackendConfig.STATUS_SUCCESS;
        this.data = data;
    }
}
