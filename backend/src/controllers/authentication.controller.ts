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

@Controller("authentication")
export class AuthenticationController {

    private readonly RESPONSE_TYPE = "code";
    private readonly BITBUCKET_OAUTH_URL = "https://bitbucket.org/site/oauth2/authorize?client_id=";
    private readonly AUTHORIZE_CALLBACK = this.BITBUCKET_OAUTH_URL + BackendConfig.BITBUCKET_KEY + "&response_type=" + this.RESPONSE_TYPE;
    private readonly GET_TOKEN_URL = "https://bitbucket.org/site/oauth2/access_token";
    private readonly GRANT_TYPE = "authorization_code";

    private log: ILogger;
    public constructor(
        loggerSrv: LoggerService,
        private httpSrv: HttpService,
        private authenticationDatabaseService: AuthenticationDatabaseService
    ) {
        this.log = loggerSrv.get("AuthenticationController");
    }


    @Get("authorize/:userCode")
    public getAuthCallback(@Param("userCode") code): ResponseDto {
        return new SuccessResponseDto(this.AUTHORIZE_CALLBACK);
    }

    @Get("oauth-callback")
    public getProviderToken(@Req() req): Observable<ResponseDto> {
        let code = req.query.code;
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
                return this.authenticationDatabaseService.setUserToken(code, userToken);
            }),
            map(res => new SuccessResponseDto(userToken)),
            catchError(error => of(new FailureResponseDto(BackendConfig.STATUS_NOT_FOUND, "Can not get user token")))
        );
    }
}
