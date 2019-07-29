import { default as NODE_CONFIG } from "./backend.config.custom";

export class BackendConfig {
    public static readonly LOG_DEBUG = true;

    public static readonly USER_COLLECTION = "users";
    public static readonly ACHIEVEMENT_COLLECTION = "achievements";
    public static readonly EVENT_COLLECTION = "events";
    public static readonly ACHIEVEMENT_DB_JSON = "brightbyte-achievement-db.json";
    public static readonly USER_DB_JSON = "brightbyte-user-db.json";
    public static readonly EVENT_DB_JSON = "brightbyte-event-db.json";
    public static readonly BACKEND_IP = "localhost";
    public static readonly BRIGHTBYTE_DB_PORT = 3000;
    public static readonly STATUS_SUCCESS = "OK";
    public static readonly STATUS_NOT_FOUND = 404;
    public static readonly STATUS_FAILURE = "Error";
    public static readonly NODE_CONFIG_URL = NODE_CONFIG.NODE_WEBSOCKET_URL;
    public static readonly originHeader = "test.com";
    public static readonly netId = "83584648538";

}
export namespace BackendConfig {
    export enum EventTypeEnum {
        Commit = "CommitEvent",
        Review = "ReviewEvent",
        Season = "SeasonEvent"
    }
}

