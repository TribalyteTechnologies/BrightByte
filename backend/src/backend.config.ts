import { default as NodeConfig } from "./backend.config.custom";
import { join } from "path";

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
    public static readonly NODE_CONFIG_URL = NodeConfig.NODE_WEBSOCKET_URL;
    public static readonly WEBAPP_URL = process.env.WEBAPP_URL || "http://localhost:8100";
    public static readonly BRIGHTBYTE_DB_PORT = process.env.PORT || 3000;
    public static readonly BRIGHT_CONTRACT_URL = BackendConfig.WEBAPP_URL + "/assets/build/Bright.json";
    public static readonly IMAGE_STORAGE_PATH = process.env.BACKEND_STORAGE_PATH || "./public/";
    public static readonly STATIC_FILES_PATH = join(__dirname, "./www/");
    public static readonly CONFIRM_AUTHENTICATION_PAGE = "confirm.html";
    public static readonly BITBUCKET_KEY = process.env.BITBUCKET_KEY;
    public static readonly BITBUCKET_SECRET = process.env.BITBUCKET_SECRET;
    public static readonly SYSTEM_CONFIGURATION = 
        {
            bitbucket: 
            {
                workspaces: (process.env.BITBUCKET_WORKSPACES || "workspace_1,workspace_2").split(",")
            },
            season:
            {
                durationInDays: + process.env.DURATION_IN_DAYS || 90
            }
        };
    public static readonly BUFFER_SIZE = 1;
}
export namespace BackendConfig {
    export enum EventTypeEnum {
        Commit = "CommitEvent",
        Review = "ReviewEvent",
        Season = "SeasonEvent",
        Delete = "DeleteEvent"
    }
    export enum AchievementTypeEnum{
        Commit,
        Review,
        TimedReview,
        Season
    }
}
