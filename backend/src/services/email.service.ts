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
    private readonly FROM_EMAIL = BackendConfig.EMAIL_TRANSPORT.auth.user;
    private readonly INVITATION_TEMPLATE = "/invitation.html";

    constructor(private mailerService: MailerService) { }

    public sendInvitationEmail(toEmail: string): Observable<ResponseDto> {
        let content = this.readFileFrom(BackendConfig.EMAIL_TEMPLATES + this.INVITATION_TEMPLATE);
        return from(this.mailerService.sendMail({
            to: toEmail,
            from: this.FROM_EMAIL,
            subject: this.INVITATION_SUBJECT,
            html: content
        })).pipe(
            map(response => new SuccessResponseDto("The invitation has been send to: " + toEmail)),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }

    private readFileFrom(filePath: string): string {
        return fs.readFileSync(filePath, { encoding: "utf8" });
    }
}
