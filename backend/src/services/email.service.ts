import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { from, Observable, of } from "rxjs";
import { ResponseDto } from "../dto/response/response.dto";
import { map, catchError } from "rxjs/operators";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { FailureResponseDto } from "../dto/response/failure-response.dto";
import { BackendConfig } from "../backend.config";
import * as fs from "fs";

@Injectable()
export class EmailService {

    private readonly INVITATION_SUBJECT = "Invitation to participate on BrightByte";
    private readonly NOTIFICATION_SUBJECT = "You've got reviews to do on BrightByte";
    private readonly BRIGHTBYTE = "BrightByte";
    private readonly FROM_INVITATION_EMAIL = this.BRIGHTBYTE + " Invitations <" + BackendConfig.EMAIL_TRANSPORT.auth.user + ">";
    private readonly FROM_NOTIFICATION_EMAIL = this.BRIGHTBYTE + " Notifications <" + BackendConfig.EMAIL_TRANSPORT.auth.user + ">";
    private readonly INVITATION_TEMPLATE_PATH = BackendConfig.EMAIL_TEMPLATES + "invitation.html";
    private readonly NOTIFICATION_TEMPLATE = "notification";

    constructor(private mailerService: MailerService) { }

    public sendInvitationEmail(toEmail: string): Observable<ResponseDto> {
        let content = this.readFileFrom(this.INVITATION_TEMPLATE_PATH);
        return from(this.mailerService.sendMail({
            to: toEmail,
            from: this.FROM_INVITATION_EMAIL,
            subject: this.INVITATION_SUBJECT,
            html: content
        })).pipe(
            map(response => new SuccessResponseDto("The invitation has been send to: " + toEmail)),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    public sendNotificationEmail(toEmail: string, teamName: string, numOfCommits: number): Observable<ResponseDto> {
        return from(this.mailerService.sendMail({
            to: toEmail,
            from: this.FROM_NOTIFICATION_EMAIL,
            subject: this.NOTIFICATION_SUBJECT,
            template: this.NOTIFICATION_TEMPLATE,
            context: {
                teamName: teamName,
                numOfCommits: numOfCommits
            }
        })).pipe(
            map(response => new SuccessResponseDto("The notification has been send to: " + toEmail)),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    private readFileFrom(filePath: string): string {
        return fs.readFileSync(filePath, { encoding: "utf8" });
    }
}
