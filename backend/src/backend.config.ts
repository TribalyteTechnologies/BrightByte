import { default as NodeConfig } from "./backend.config.custom";

export class BackendConfig {
    public static readonly LOG_DEBUG = true;

    public static readonly USER_COLLECTION = "users";
    public static readonly ACHIEVEMENT_COLLECTION = "achievements";
    public static readonly EVENT_COLLECTION = "events";
    public static readonly ACHIEVEMENT_DB_JSON = "brightbyte-achievement-db.json";
    public static readonly USER_DB_JSON = "brightbyte-user-db.json";
    public static readonly EVENT_DB_JSON = "brightbyte-event-db.json";
    public static readonly STATUS_SUCCESS = "OK";
    public static readonly STATUS_NOT_FOUND = "Not Found";
    public static readonly STATUS_FAILURE = "Error";
    public static readonly NET_ID = "83584648538";
    public static readonly SCORE_DIVISION_FACTOR = 100;
    public static readonly ACH_TROPHY_PATH = "../../assets/imgs/trophys/achievement";
    public static readonly ACH_TIMED_TROPHY_PATH = "../../assets/imgs/trophys/timedAchievement";
    public static readonly ACH_IMG_FORMAT = ".svg";
    public static readonly INITIALIZE_USER_DATABASE = false;
    public static readonly NODE_CONFIG_URL = NodeConfig.NODE_WEBSOCKET_URL;
    public static readonly WEBAPP_URL = process.env.WEBAPP_URL || "http://localhost:8100";
    public static readonly BRIGHTBYTE_DB_PORT = process.env.PORT || 3000;
    public static readonly BRIGHT_CONTRACT_URL = BackendConfig.WEBAPP_URL + "/assets/build/Bright.json";
    public static readonly IMAGE_STORAGE_PATH = "./public/";

}
export namespace BackendConfig {
    export enum EventTypeEnum {
        Commit = "CommitEvent",
        Review = "ReviewEvent",
        Season = "SeasonEvent"
    }
    export enum AchievementTypeEnum{
        Commit,
        Review,
        TimedReview,
        Season
    }
}

