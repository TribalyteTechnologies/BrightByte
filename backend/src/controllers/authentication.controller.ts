import { Controller, Get, Param, Req, HttpService } from "@nestjs/common";
import { ILogger, LoggerService } from "../logger/logger.service";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { ResponseDto } from "../dto/response/response.dto";
import { BackendConfig } from "../backend.config";
import { FailureResponseDto } from "src/dto/response/failure-response.dto";
import { map, catchError, flatMap } from "rxjs/operators";
import { Observable, of } from "rxjs";
import { AuthenticationDatabaseService } from "src/services/authentication-database.service";
import * as querystring from "querystring";
import { ClientNotificationService } from "src/services/client-notfication.service";

@Controller("authentication")
export class AuthenticationController {

    private readonly RESPONSE_TYPE = "code";
    private readonly BITBUCKET_OAUTH_URL = "https://bitbucket.org/site/oauth2/authorize?client_id=";
    private readonly AUTHORIZE_AUX = this.BITBUCKET_OAUTH_URL + BackendConfig.BITBUCKET_KEY + "&response_type=" + this.RESPONSE_TYPE;
    private readonly AUTHORIZE_CALLBACK = this.AUTHORIZE_AUX + "&state=";
    private readonly GET_TOKEN_URL = "https://bitbucket.org/site/oauth2/access_token";
    private readonly GRANT_TYPE = "authorization_code";
    private readonly CLOSE_POP_UP = "<script>window.close()</script>";

    private log: ILogger;
    public constructor(
        loggerSrv: LoggerService,
        private httpSrv: HttpService,
        private authenticationDatabaseService: AuthenticationDatabaseService,
        private clientNotificationService: ClientNotificationService
    ) {
        this.log = loggerSrv.get("AuthenticationController");
    }


    @Get("authorize/:userCode")
    public getAuthCallback(@Param("userCode") code): ResponseDto {
        this.log.d("The user requesting authentication is: " + code);
        return new SuccessResponseDto(this.AUTHORIZE_CALLBACK + code);
    }

    @Get("oauth-callback")
    public getProviderToken(@Req() req): Observable<string | ResponseDto> {
        let code = req.query.code;
        let userIdentifier = req.query.state;
        let digested = new Buffer(BackendConfig.BITBUCKET_KEY + ":" + BackendConfig.BITBUCKET_SECRET).toString("base64");
        let accessTokenOptions = { grant_type: this.GRANT_TYPE, code: code };
        let accessTokenConfig = {
            headers:
            {
                "Cache-Control": "no-cache",
                "Authorization": "Basic " + digested,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };
        let userToken: string;
        return this.httpSrv.post(this.GET_TOKEN_URL, querystring.stringify(accessTokenOptions), accessTokenConfig).pipe(
            flatMap(response => {
                userToken = response.data.access_token;
                this.log.d("Response: ", response.data);
                return this.authenticationDatabaseService.setUserToken(userIdentifier, userToken);
            }),
            map(res => {
                this.clientNotificationService.sendToken(userIdentifier, userToken);
                return this.CLOSE_POP_UP;
            }),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_NOT_FOUND, "Can not get user token")))
        );
    }
}
