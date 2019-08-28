import { ResponseDto } from "./response.dto";
import { BackendConfig } from "../../backend.config";

export class FailureResponseDto extends ResponseDto {
    public constructor(status: string, data?: any) {
        super();
        this.status = status;
        this.data = data;
    }
}
