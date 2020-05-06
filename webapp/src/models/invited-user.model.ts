import { AppConfig } from "../app.config";

export class InvitedUser { 
    public email: string;
    public invitationExp: Date;
    public userType: AppConfig.UserType;
    public displayDate: string;

    constructor(email: string, invitationExp: number, userType: AppConfig.UserType) {
        this.email = email;
        this.invitationExp = new Date(invitationExp * AppConfig.SECS_TO_MS);
        this.userType = userType;
        this.displayDate = this.invitationExp.getDay() + "/" + this.invitationExp.getMonth()
        + "/" + this.invitationExp.getFullYear() + " - " + this.invitationExp.getHours()
        + ":" + this.padWithZeroes(this.invitationExp.getMinutes(), 2);
    }

    private padWithZeroes(value: number, length: number) {
        let str = "" + value;
        while (str.length < length) {
            str = "0" + str;
        }
        return str;
    }
}
