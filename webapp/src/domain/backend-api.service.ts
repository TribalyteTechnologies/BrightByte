import { Injectable } from "@angular/core";
import { Socket } from "ng-socket-io";
import { WebSocketService } from "../core/websocket.service";
import { Achievement } from "../models/achievement.model";
import { AchievementService } from "./achievement.service";
import { ILogger, LoggerService } from "../core/logger.service";
import { LoginService } from "../core/login.service";

@Injectable()
export class BackendApiService {

    private readonly ADD_USER = "addUser";
    private readonly NEW_ACHIEVEMENT = "newAchievement";
    private readonly CONNECTION = "connect";

    private socket: Socket;
    private log: ILogger;

    public constructor(
        private websocketSrv: WebSocketService,
        private achievementSrv: AchievementService,
        private loginSrv: LoginService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("BackendApiService");

        this.socket = this.websocketSrv.getSocket();
    }

    public initBackendConnection(userAddress: string) {
        this.socket.emit(this.ADD_USER, userAddress);
        this.log.d("Backend connection established");
        this.registerNewAchievementListener();
        this.registerConnectionListener();
    }

    private registerNewAchievementListener() {
        this.socket.on(this.NEW_ACHIEVEMENT, (achievements) => {
            achievements.forEach(achievement => {
                let newAchievement = new Achievement(
                    false, achievement.title, achievement.values[0], achievement.parameter, achievement.iconPath);
                this.achievementSrv.addNewAchievement(newAchievement);
                this.log.d("New achievement recieved" + newAchievement);
            });
            this.achievementSrv.checkAchievementStack();
        });
    }

    private registerConnectionListener() {
        this.socket.on(this.CONNECTION, () => {
            this.socket.emit(this.ADD_USER, this.loginSrv.getAccountAddress());
            this.log.d("Sending user address to the backend");
        });
    }
}
