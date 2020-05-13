import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { from, Observable, of, forkJoin } from "rxjs";
import { ResponseDto } from "../dto/response/response.dto";
import { map, catchError } from "rxjs/operators";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { FailureResponseDto } from "../dto/response/failure-response.dto";

@Injectable()
export class EmailService {

    private readonly INVITATION_SUBJECT = "Invitation to participate on BrightByte";
    private readonly FROM_EMAIL = "noreply@nestjs.com";
    private readonly INVITATION_TEMPLATE = "invitation";

    constructor(private mailerService: MailerService) { }

    public sendInvitationEmail(toEmail: string): Observable<ResponseDto> {
        return from(this.mailerService.sendMail({
            to: toEmail,
            from: this.FROM_EMAIL,
            subject: this.INVITATION_SUBJECT,
            template: this.INVITATION_TEMPLATE
        })).pipe(
            map(response => new SuccessResponseDto("The invitation has been send to: " + toEmail)),
            catchError(error => of(new FailureResponseDto(error)))
        );
    }
}
