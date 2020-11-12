import { Response, Request } from "express";
import { Controller, Get, Param, Request as Req, HttpService, Response as Res } from "@nestjs/common";
import { ILogger, LoggerService } from "../logger/logger.service";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { ResponseDto } from "../dto/response/response.dto";
import { BackendConfig } from "../backend.config";
import { map } from "rxjs/operators";
import * as querystring from "querystring";
import { ClientNotificationService } from "../services/client-notfication.service";
import { FailureResponseDto } from "../dto/response/failure-response.dto";

interface IFooParams extends querystring.ParsedUrlQueryInput {
    readonly grant_type: string;
    readonly code: string;
}

@Controller("authentication")
export class AuthenticationController {

    private readonly RESPONSE_TYPE = "code";
    private readonly BITBUCKET_OAUTH_URL = "https://bitbucket.org/site/oauth2/authorize?client_id=";
    private readonly AUTHORIZE_AUX = this.BITBUCKET_OAUTH_URL + BackendConfig.BITBUCKET_KEY + "&response_type=" + this.RESPONSE_TYPE;
    private readonly AUTHORIZE_CALLBACK = this.AUTHORIZE_AUX + "&state=";
    private readonly GET_TOKEN_URL_BITBUCKET = "https://bitbucket.org/site/oauth2/access_token";
    private readonly GET_TOKEN_URL_GITHUB = "https://github.com/login/oauth/access_token";
    private readonly GRANT_TYPE = "authorization_code";
    private readonly GITHUB_URL = "https://github.com/login/oauth/";
    private readonly GITHUB_AUTHORIZE_CALLBACK = this.GITHUB_URL + "authorize?client_id=" + BackendConfig.GITHUB_KEY + "&state=";
    private readonly GET_GITHUB_TOKEN_URL_AUX = this.GITHUB_URL + "access_token?client_id=" + BackendConfig.GITHUB_KEY;
    private readonly GET_GITHUB_TOKEN_URL = this.GET_GITHUB_TOKEN_URL_AUX + "&client_secret=" + BackendConfig.GITHUB_SECRET;
    private readonly BITBUCKET_PROVIDER = "bitbucket";
    private readonly GITHUB_PROVIDER = "github";

    private log: ILogger;
    public constructor(
        loggerSrv: LoggerService,
        private httpSrv: HttpService,
        private clientNotificationService: ClientNotificationService
    ) {
        this.log = loggerSrv.get("AuthenticationController");
    }

    @Get("authorize/:provider/:user/:teamUid/:version")
    public getProviderAuthCallback(
        @Param("user") user: string,
        @Param("teamUid") teamUid: number,
        @Param("version") version: number,
        @Param("provider") provider: string): ResponseDto {
        let ret: ResponseDto;
        const code = user + "-" + teamUid + "-" + version;
        this.log.d("The user requesting authentication is: " + code);
        switch (provider) {
            case this.BITBUCKET_PROVIDER:
                ret = BackendConfig.BITBUCKET_KEY ? new SuccessResponseDto(this.AUTHORIZE_CALLBACK + code) :
                    new FailureResponseDto(BackendConfig.STATUS_NOT_FOUND, "Provider not defined. Provider service not available");
                break;
            case this.GITHUB_PROVIDER:
                ret = BackendConfig.GITHUB_KEY ? new SuccessResponseDto(this.GITHUB_AUTHORIZE_CALLBACK + code) :
                    new FailureResponseDto(BackendConfig.STATUS_NOT_FOUND, "Provider not defined. Provider service not available");
                break;
            default:
                ret = new FailureResponseDto(BackendConfig.STATUS_NOT_FOUND, "Provider not defined.");
        }
        return ret;
    }

    @Get("oauth-callback/github")
    public getProvider(@Req() req: Request, @Res() response: Response) {
        let code = req.query.code;
        let userIdentifier = req.query.state ? req.query.state .toString() : "";
        let tokenUrlPath = this.GET_GITHUB_TOKEN_URL + "&code=" + code + "&state=" + userIdentifier;
        this.httpSrv.post(tokenUrlPath, null, { headers: { "Accept": "application/json" } }).pipe(
            map(res => {
                this.log.d("Response: ", res.data);
                let userToken = res.data.access_token;
                this.clientNotificationService.sendToken(userIdentifier, userToken, this.GITHUB_PROVIDER);
                return response.sendFile(BackendConfig.CONFIRM_AUTHENTICATION_PAGE);
            })
        ).subscribe(() => {
            this.log.d("The user has completed the Github authentication process");
        });
    }

    @Get("oauth-callback/bitbucket")
    public getBitbucketToken(@Req() req: Request, @Res() response: Response) {
        let code = req.query.code.toString();
        let userIdentifier = req.query.state.toString();
        this.log.d("The user identifier is", userIdentifier);
        let digested = Buffer.from((BackendConfig.BITBUCKET_KEY + ":" + BackendConfig.BITBUCKET_SECRET)).toString("base64");
        let accessTokenOptions: IFooParams = { grant_type: this.GRANT_TYPE, code: code };
        let accessTokenConfig = {
            headers:
            {
                "Cache-Control": "no-cache",
                "Authorization": "Basic " + digested,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };
        this.httpSrv.post(this.GET_TOKEN_URL_BITBUCKET, querystring.stringify(accessTokenOptions), accessTokenConfig).subscribe(
            res => {
            let userToken = res.data.access_token;
            this.log.d("Response: ", res.data);
            this.clientNotificationService.sendToken(userIdentifier, userToken, this.BITBUCKET_PROVIDER);
            this.log.d("The user has completed the authentication process");
            return response.sendFile(BackendConfig.CONFIRM_AUTHENTICATION_PAGE);
        },  error => {
            this.log.e("Error getting bitbucket token ", error);
            return response.status(404).send();
        });
    }
}
