import { AppConfig } from "../app.config";
import { FormatUtils } from "../core/format-utils";

export class InvitedUser { 
    public email: string;
    public invitationExpDate: Date;
    public userType: AppConfig.UserType;
    public displayDate: string;

    constructor(email: string, invitationExpDate: number, userType: AppConfig.UserType) {
        this.email = email;
        this.invitationExpDate = new Date(invitationExpDate * AppConfig.SECS_TO_MS);
        this.userType = userType;
        this.displayDate = this.invitationExpDate.getDate() + "/" + (this.invitationExpDate.getMonth() + 1)
        + "/" + this.invitationExpDate.getFullYear() + " - " + this.invitationExpDate.getHours()
        + ":" + FormatUtils.padWithZeroes(this.invitationExpDate.getMinutes(), 2);
    }
}
