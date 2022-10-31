import { default as NodeConfig } from "./backend.config.custom";
import { join } from "path";

export class BackendConfig {
    public static readonly LOG_DEBUG = true;

    public static readonly USER_COLLECTION = "users";
    public static readonly TEAMS_COLLECTION = "teams";
    public static readonly ACHIEVEMENT_COLLECTION = "achievements";
    public static readonly EVENT_COLLECTION = "events";
    public static readonly ACHIEVEMENT_DB_JSON = "brightbyte-achievement-db.json";
    public static readonly USER_DB_JSON = "brightbyte-user-db.json";
    public static readonly EVENT_DB_JSON = "brightbyte-event-db.json";
    public static readonly TEAMS_DB_JSON = "brightbyte-team-db.json";
    public static readonly DB_BASE_PATH = process.env.DB_BASE_PATH || ".";
    public static readonly STATUS_SUCCESS = "OK";
    public static readonly STATUS_NOT_FOUND = "Not Found";
    public static readonly STATUS_FAILURE = "Error";
    public static readonly NET_ID = process.env.NET_ID || "5777";
    public static readonly SCORE_DIVISION_FACTOR = 100;
    public static readonly ACH_TROPHY_PATH = "assets/imgs/trophys/achievement";
    public static readonly ACH_TIMED_TROPHY_PATH = "assets/imgs/trophys/timedAchievement";
    public static readonly ACH_IMG_FORMAT = ".svg";
    public static readonly NODE_CONFIG_URL = NodeConfig.NODE_WEBSOCKET_URL;
    public static readonly WEBAPP_BASE_URL = process.env.WEBAPP_BASE_URL || "http://localhost:8100";
    public static readonly WEBAPP_URL = BackendConfig.WEBAPP_BASE_URL + (process.env.LATEST_DIR || "");
    public static readonly BRIGHTBYTE_API_PORT = process.env.PORT || 3000;
    public static readonly CLOUD_EVENT_DISPATCHER_CONTRACT_URL = BackendConfig.WEBAPP_URL + "/assets/build/CloudEventDispatcher.json";
    public static readonly CLOUD_BB_TEAM_MANAGER_CONTRACT_URL = BackendConfig.WEBAPP_URL + "/assets/build/CloudTeamManager.json";
    public static readonly PROXY_MANAGER_CONTRACT_URL = BackendConfig.WEBAPP_URL + "/assets/build/ProxyManager.json";
    public static readonly IMAGE_STORAGE_PATH = process.env.BACKEND_STORAGE_PATH || "./public/";
    public static readonly SECRET_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY_PATH || "./secrets/private.key";
    public static readonly SECRET_CERTIFICATE_CRT = process.env.BACKEND_SECRET_CERTIFICATE_PATH || "./secrets/certificate.crt";
    public static readonly EMAIL_TEMPLATES = join(__dirname, "./templates/");
    public static readonly CONFIRM_AUTHENTICATION_PAGE =  join(__dirname, "./www/confirm.html");
    public static readonly BITBUCKET_KEY = process.env.BITBUCKET_KEY;
    public static readonly BITBUCKET_SECRET = process.env.BITBUCKET_SECRET;
    public static readonly GITHUB_KEY = process.env.GITHUB_KEY;
    public static readonly GITHUB_SECRET = process.env.GITHUB_SECRET;
    public static readonly BUFFER_SIZE = 1;

    public static readonly EMAIL_TRANSPORT = {
        host: process.env.SMTP_EMAIL_HOST,
        port: process.env.SMTP_EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASS
        }
    };
}
export namespace BackendConfig {
    export enum EventTypeEnum {
        Commit = "CommitEvent",
        Review = "ReviewEvent",
        Season = "SeasonEvent",
        Delete = "DeleteEvent",
        NewUser = "NewUserEvent"
    }
    export enum AchievementTypeEnum{
        Commit,
        Review,
        TimedReview,
        Season
    }
}
