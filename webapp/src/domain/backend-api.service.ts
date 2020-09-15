import { Injectable } from "@angular/core";
import { Socket } from "ng-socket-io";
import { WebSocketService } from "../core/websocket.service";
import { Achievement } from "../models/achievement.model";
import { AchievementService } from "./achievement.service";
import { ILogger, LoggerService } from "../core/logger.service";
import { BitbucketService } from "./bitbucket.service";
import { LoginService } from "../core/login.service";

@Injectable()
export class BackendApiService {

    private readonly ADD_USER = "addUser";
    private readonly NEW_ACHIEVEMENT = "newAchievement";
    private readonly NEW_TOKEN = "newToken";
    private readonly CONNECTION = "connect";
    private readonly BITBUCKET_PROVIDER = "bitbucket";
    private readonly GITHUB_PROVIDER = "github";

    private socket: Socket;
    private log: ILogger;

    public constructor(
        private websocketSrv: WebSocketService,
        private achievementSrv: AchievementService,
        private bitbucketService: BitbucketService,
        private loginSrv: LoginService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("BackendApiService");

        this.socket = this.websocketSrv.getSocket();
    }

    public initBackendConnection(teamUid: number) {
        let userAddress = this.loginSrv.getAccountAddress();
        let sessionId = userAddress + "-" + teamUid;
        this.socket.emit(this.ADD_USER, sessionId);
        this.log.d("Backend connection established");
        this.registerNewAchievementListener();
        this.registerTokenListener();
        this.registerConnectionListener(sessionId);
    }

    private registerNewAchievementListener() {
        this.socket.on(this.NEW_ACHIEVEMENT, (achievements) => {
            achievements.forEach(achievement => {
                let newAchievement = new Achievement(
                    false, achievement.title, achievement.values[0], achievement.parameter, 
                    achievement.iconPath, achievement.processorType);
                this.achievementSrv.addNewAchievement(newAchievement);
                this.log.d("New achievement recieved" + newAchievement);
            });
            this.achievementSrv.checkAchievementStack();
        });
    }

    private registerTokenListener() {
        this.socket.on(this.NEW_TOKEN, (content) => {
            const provider = content[0];
            const token = content[1];
            switch (provider) {
                case this.BITBUCKET_PROVIDER:
                    this.log.d("New bitbucket token");
                    this.bitbucketService.setUserToken(token);
                    break;
                case this.GITHUB_PROVIDER:
                    this.log.d("New github token");
                    break;
                default:
                    this.log.d("Provider not defined.");
            }
        });
    }

    private registerConnectionListener(sessionId: string) {
        this.socket.on(this.CONNECTION, () => {
            this.socket.emit(this.ADD_USER, sessionId);
            this.log.d("Sending user address to the backend");
        });
    }
}
