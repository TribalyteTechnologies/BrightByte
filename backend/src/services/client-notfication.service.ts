import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { ILogger, LoggerService } from "../logger/logger.service";
import { AchievementDto } from "src/dto/achievement.dto";
import { AchievementDatabaseService } from "./achievement-database.service";

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

    public sendNewAchievement(userAddress: string, achievementIds: number[]) {
        let userSession = null;
        for (let [key, value] of this.sessions.entries()) {
            if (value === userAddress) {
                userSession = key;
            }
        }
        this.achievementDbSrv.getAchievements(achievementIds.toString()).subscribe(response => {
            this.log.d("sending achievements", response);
            this.sockets[userSession].emit("newAchievement", response);
        });
        
    }
}
