import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { ILogger, LoggerService } from "../logger/logger.service";
import { AchievementDatabaseService } from "./achievement-database.service";
import { AchievementDto } from "../dto/achievement.dto";

@Injectable()
export class ClientNotificationService {

    private log: ILogger;
    private server: Server;
    private sockets: { [id: string]: SocketIO.Socket };
    private sessions = new Map<string, string>();

    public constructor(
        private loggerSrv: LoggerService,
        private achievementDbSrv: AchievementDatabaseService

    ) {
        this.log = this.loggerSrv.get("ClientNotificationService");
    }

    public setServer(server: Server) {
        this.server = server;
        this.sockets = this.server.sockets.sockets;
        this.log.d("Server instance recieved");
    }

    public addSession(sessionId: string, userAddress: string) {
        this.sessions.set(sessionId, userAddress);
    }

    public removeSession(userSession: string): boolean {
        return this.sessions.delete(userSession);
    }

    public getSession(userAddress: string): string {
        let userSession = this.getSession(userAddress);
        return userSession;
    }

    public sendNewAchievement(userAddress: string, achievements: Array<AchievementDto>) {
        let isDbInitOngoing = this.sessions.size <= 0;
        if (!isDbInitOngoing) {
            let userSession = this.findKey(userAddress);
            try {
                this.log.d("Sending achievements: ", achievements);
                this.sockets[userSession].emit("newAchievement", achievements);
            } catch (error) {
                this.log.e("Cannot send achievement to client", error);
            }
        }
    }

    public sendToken(userAddress: string, token: string) {
        let isDbInitOngoing = this.sessions.size <= 0;
        if (!isDbInitOngoing) {
            let userSession = this.findKey(userAddress);
            try {
                this.log.d("Sending token to user: ", userAddress);
                this.sockets[userSession].emit("newToken", token);
            } catch (error) {
                this.log.e("Cannot send achievement to client", error);
            }
        }
    }

    private findKey(userAddress: string): string {
        let userSession: string;
        if (this.sessions.size > 0) {
            for (let [key, value] of this.sessions.entries()) {
                if (value === userAddress) {
                    userSession = key;
                    break;
                }
            }
        }
        return userSession;
    }
}
