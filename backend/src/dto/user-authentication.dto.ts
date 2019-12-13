import { BackendConfig } from "../backend.config";

export class UserAuthenticationDto {
    public constructor(
        public id: string,
        public token: string
    ) {
        this.id = id;
        this.token = token;
    }
} 
