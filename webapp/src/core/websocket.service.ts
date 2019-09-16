import { Injectable } from "@angular/core";
import { Socket } from "ng-socket-io";

@Injectable()
export class WebSocketService {

    public constructor(
        private socket: Socket
    ){
    }

    public getSocket(): Socket{
        return this.socket;
    }

    public connect(){
        this.socket.connect();
    }

    public disconnect(){
        this.socket.disconnect();
    }
   
}
