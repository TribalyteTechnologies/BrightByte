import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as io from "socket.io-client";
import { AppModule } from "../app/app.module";

const USER_ADDRESS = "0x7777274281F6Cbc49F540b69713380bBeA5DF777";
const ADD_USER = "addUser";
const ADD_ADDRESS = "addAddress";
const REMOVE_ADDRESS = "removeAddress";

const WS_SERVER_BASE_ADDRESS = "localhost";
const WS_LISTEN_PORT = 3000;
const WS_SERVER_ADDRESS = "http://" + WS_SERVER_BASE_ADDRESS + ":" + WS_LISTEN_PORT;

async function createNestApp(): Promise<INestApplication> {
    const testingModule = await Test.createTestingModule({
        imports: [AppModule]
    }).compile();
    const app = await testingModule.createNestApplication();
    return app;
}

describe("Add user address test", () => {
    let app;

    it("Add user address test", async () => {
        app = await createNestApp();
        await app.listenAsync(WS_LISTEN_PORT);

        let socket = io.connect(WS_SERVER_ADDRESS);
        socket.on(ADD_ADDRESS, msg => {
            expect(msg).toBe(true);
        });
        socket.emit(ADD_USER, USER_ADDRESS);
    });

    it("Add and remove user address test", async () => {
        app = await createNestApp();
        await app.listenAsync(WS_LISTEN_PORT);

        let socket = io.connect(WS_SERVER_ADDRESS);
        
        socket.on(REMOVE_ADDRESS, msg => {
            expect(msg).toBe(true);
        });

        socket.on(ADD_ADDRESS, msg => {
            expect(msg).toBe(true);
            socket.emit(REMOVE_ADDRESS, USER_ADDRESS);
        });
        
        socket.emit(ADD_USER, USER_ADDRESS);
    });

    afterEach(async () => {
        await app.close();
    });
});



