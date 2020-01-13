import { Controller, Get, Param, Req, HttpService, Res } from "@nestjs/common";
import { ILogger, LoggerService } from "../logger/logger.service";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { ResponseDto } from "../dto/response/response.dto";
import { BackendConfig } from "../backend.config";
import { map, flatMap } from "rxjs/operators";
import { AuthenticationDatabaseService } from "../services/authentication-database.service";
import * as querystring from "querystring";
import { ClientNotificationService } from "../services/client-notfication.service";
import { FailureResponseDto } from "src/dto/response/failure-response.dto";

@Controller("authentication")
export class AuthenticationController {

    private readonly RESPONSE_TYPE = "code";
    private readonly BITBUCKET_OAUTH_URL = "https://bitbucket.org/site/oauth2/authorize?client_id=";
    private readonly AUTHORIZE_AUX = this.BITBUCKET_OAUTH_URL + BackendConfig.BITBUCKET_KEY + "&response_type=" + this.RESPONSE_TYPE;
    private readonly AUTHORIZE_CALLBACK = this.AUTHORIZE_AUX + "&state=";
    private readonly GET_TOKEN_URL = "https://bitbucket.org/site/oauth2/access_token";
    private readonly GRANT_TYPE = "authorization_code";

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
        let ret: ResponseDto;
        if(BackendConfig.BITBUCKET_KEY) {
            this.log.d("The user requesting authentication is: " + code);
            ret = new SuccessResponseDto(this.AUTHORIZE_CALLBACK + code);
        } else {
            ret = new FailureResponseDto(BackendConfig.STATUS_NOT_FOUND, "Bitbucket provider not defined. Provider service not available");
        }
        return ret;
    }

    @Get("oauth-callback")
    public getProviderToken(@Req() req, @Res() response) {
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
        this.httpSrv.post(this.GET_TOKEN_URL, querystring.stringify(accessTokenOptions), accessTokenConfig).pipe(
            flatMap(res => {
                userToken = res.data.access_token;
                this.log.d("Response: ", res.data);
                return this.authenticationDatabaseService.setUserToken(userIdentifier, userToken);
            }),
            map(res => {
                this.clientNotificationService.sendToken(userIdentifier, userToken);
                return response.sendFile(BackendConfig.STATIC_FILES_PATH + BackendConfig.CONFIRM_AUTHENTICATION_PAGE);
            })
        ).subscribe(res => {
            this.log.d("The user has completed the authentication process", res);
        });
    }
}
