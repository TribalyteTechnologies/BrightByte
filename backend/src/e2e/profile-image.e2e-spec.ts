import request from "supertest";
import post from "supertest";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app/app.module";
import { INestApplication } from "@nestjs/common";
import { BackendConfig } from "../backend.config";

describe("ProfileImage", () => {
    const USER_ADDRESS = "0x7777274281F6Cbc49F540b69713380bBeA5DF777";
    const UNREGISTERED_USER_ADDRESS = "0x1234567891234567891234567891234567891234";
    const PROFILE_IMAGE_URL = "/profile-image/";
    const GET_PROFILE_IMAGE = PROFILE_IMAGE_URL + "getPath/";
    const UPLOAD_PROFILE_IMAGE = PROFILE_IMAGE_URL + "upload/?userHash=";
    const FILE_PATH = "./src/e2e/testUpload.svg";
    let app: INestApplication;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule]
        })
            .compile();
        app = module.createNestApplication();
        await app.init();
    });

    describe("Getting the avatar with UNREGISTERED user", () => {
        it("/GET profile-image", () => {
            return request(app.getHttpServer())
                .get(GET_PROFILE_IMAGE + UNREGISTERED_USER_ADDRESS)
                .expect(200)
                .then(res => {
                    expect(res.body.status).toBe(BackendConfig.STATUS_NOT_FOUND);
                });

        });
    });

    describe("POST /profile-image/upload - upload a new image", () => {
        it("/Post profile-image", () => {
            return request(app.getHttpServer())
                .post(UPLOAD_PROFILE_IMAGE + USER_ADDRESS)
                .attach("image", FILE_PATH)
                .expect(201)
                .then(res => {
                    expect(res.body.data).toBe(USER_ADDRESS);
                });

        });
    });

    describe("Now we are getting the uploaded image", () => {
        it("/GET profile-image", () => {
            return request(app.getHttpServer())
                .get(GET_PROFILE_IMAGE + USER_ADDRESS)
                .expect(200)
                .then(res => {
                    expect(res.body.data).toBe(USER_ADDRESS);
                });

        });
    });

    afterEach(async () => {
        let a = await app.close();
    });
});
