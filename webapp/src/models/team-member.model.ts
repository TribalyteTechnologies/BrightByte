import { AppConfig } from "../app.config";

export class TeamMember { 
    public address: string;
    public email: string;
    public userType: AppConfig.UserType;

    constructor(address: string, email?: string, userType?: AppConfig.UserType) {
        this.address = address;
        this.email = email;
        this.userType = userType;
    }
}
