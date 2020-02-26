import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { ILogger, LoggerService } from "../logger/logger.service";
import { AchievementDatabaseService } from "./achievement-database.service";
import { AchievementDto } from "../dto/achievement.dto";

@Injectable()
export class ClientNotificationService {

    private readonly NEW_ACHIEVEMENT = "newAchievement";
    private readonly NEW_TOKEN = "newToken";

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
        this.log.d("User " + userAddress + "has addedd a new session " + sessionId);
    }

    public removeSession(userSession: string): boolean {
        return this.sessions.delete(userSession);
    }

    public getSession(userAddress: string): string {
        let userSession = this.getSession(userAddress);
        return userSession;
    }

    public sendNewAchievement(userAddress: string, achievements: Array<AchievementDto>) {
        this.log.d("Sending achievements: ", achievements);
        this.send(userAddress, this.NEW_ACHIEVEMENT, achievements);
    }

    public sendToken(userAddress: string, token: string) {
        this.log.d("Sending token to user: ", userAddress);
        this.send(userAddress, this.NEW_TOKEN, token);
    }

    private send(userAddress: string, event: string, content: string | Array<AchievementDto>) {
        let isDbInitOngoing = this.sessions.size <= 0;
        if (!isDbInitOngoing) {
            let userSessions = this.findKey(userAddress);
            try {
                userSessions.forEach(session => {
                    this.sockets[session].emit(event, content);
                });
            } catch (error) {
                this.log.e("Cannot send content to client", error);
            }
        }
    }

    private findKey(userAddress: string): Array<string> {
        let userSessions = [];
        if (this.sessions.size > 0) {
            for (let [key, value] of this.sessions.entries()) {
                if (value === userAddress) {
                    userSessions.push(key);
                }
            }
        }
        return userSessions;
    }
}
