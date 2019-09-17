import request from "supertest";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app/app.module";
import { INestApplication } from "@nestjs/common";

describe("Achievements", () => {
  const USER_ADDRESS = "0x05e877764bA5f17926c3a918B58255BB1C42aDF4";
  const ACHIEVEMENT_QUERY = "/database/achievements/";
  const EXPECTED_ACHIEVEMENTS_LENGTH = 2;
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule]
    })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  it("/GET achievements", () => {
    return request(app.getHttpServer())
      .get(ACHIEVEMENT_QUERY + USER_ADDRESS)
      .expect(200)
      .then(res => {
        expect(res.body.data.length).toBe(EXPECTED_ACHIEVEMENTS_LENGTH);
      });
      
  });

  afterEach(async () => {
    let a = await app.close();
  });
});
