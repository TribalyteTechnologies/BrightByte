import { Injectable } from "@angular/core";
import { Socket } from "ng-socket-io";
import { WebSocketService } from "../core/websocket.service";
import { Achievement } from "../models/achievement.model";
import { AchievementService } from "../core/achievement.service";
import { UserAddressService } from "./user-address.service";

@Injectable()
export class BackendAPIService {

    private readonly ADD_USER = "addUser";
    private readonly NEW_ACHIEVEMENT = "newAchievement";
    private readonly CONNECTION = "connect";

    private socket: Socket;

    public constructor(
        private websocketSrv: WebSocketService,
        private achievementSrv: AchievementService,
        private userAddrSrv: UserAddressService
    ) {
        this.socket = this.websocketSrv.getSocket();
    }

    public initBackendConnection(userAddress: string) {
        this.socket.emit(this.ADD_USER, userAddress);
        this.registerNewAchievementListener();
        this.registerConnectionListener();
    }

    private registerNewAchievementListener() {
        this.socket.on(this.NEW_ACHIEVEMENT, (achievements) => {
            achievements.forEach(achievement => {
                let newAchievement = new Achievement(
                    false, achievement.title, achievement.values[0], achievement.parameter, achievement.iconPath);
                this.achievementSrv.addNewAchievement(newAchievement);
            });
            this.achievementSrv.checkAchievementStack();
        });

    }

    private registerConnectionListener() {
        this.socket.on(this.CONNECTION, () => {
            this.socket.emit(this.ADD_USER, this.userAddrSrv.get());
        });
    }
}
