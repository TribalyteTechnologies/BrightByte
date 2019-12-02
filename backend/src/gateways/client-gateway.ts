import {
    SubscribeMessage,
    WebSocketGateway,
    WsResponse,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayDisconnect,
    OnGatewayConnection
} from "@nestjs/websockets";
import { Observable } from "rxjs";
import { Client, Server } from "socket.io";
import { LoggerService, ILogger } from "../logger/logger.service";
import { ClientNotificationService } from "../services/client-notfication.service";

@WebSocketGateway()
export class ClientGateway implements OnGatewayInit, OnGatewayDisconnect, OnGatewayConnection{

    private log: ILogger;

    @WebSocketServer()
    private server: Server;

    private client: Client;

    public constructor(
        private loggerSrv: LoggerService,
        private clientNtSrv: ClientNotificationService
    ) { }

    public afterInit() {
        this.log = this.loggerSrv.get("ClientGateway");
        this.clientNtSrv.setServer(this.server);
    }

    public handleDisconnect(client: Client) {
        this.log.d("Client " + client.id + " has disconnected");
        let userRemoved = this.clientNtSrv.removeSession(client.id);
        if (userRemoved){
            this.log.d("Client " + client.id + " has been removed from connectedUsers map");
        }
    }
    public handleConnection(client: Client) {
        this.log.d("Client " + client.id + " has connected");
    }

    @SubscribeMessage("addUser")
    private addUser(client: Client, address: string): Observable<WsResponse<boolean>> {
        return new Observable<WsResponse<boolean>>(observer => {
            if (address) {
                this.clientNtSrv.addSession(client.id, address);
                this.log.d("Address " + address + " added");
                observer.next({ event: "addAddress", data: true });
                observer.complete();
            } else {
                observer.error();
            }
        });
    }

    @SubscribeMessage("removeAddress")
    private removeAddress(client: Client, address: string): Observable<WsResponse<boolean>> {
        return new Observable<WsResponse<boolean>>(observer => {
            if (address) {
                this.clientNtSrv.removeSession(address);
                this.log.d("Address " + address + " removed");
                observer.next({ event: "removeAddress", data: true });
                observer.complete();
            } else {
                observer.error();
            }
        });
    }
}
