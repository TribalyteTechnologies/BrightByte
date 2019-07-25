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
    public static readonly web3Provider_ws = "ws://5.56.60.217/ws";
    public static readonly originHeader = "test.com";
    public static readonly netId = "83584648538";

    //Requests
    public static readonly REQUEST_BASE = "http://" + BackendConfig.BACKEND_IP + ":" + BackendConfig.BRIGHTBYTE_DB_PORT;

    public static readonly SET_OBTAINED_ACHIEVEMENTS = BackendConfig.REQUEST_BASE + "/database/achievements/";
    public static readonly IS_OBTAINED_REQ = BackendConfig.REQUEST_BASE + "/database/hasAchievement/";
}
export namespace BackendConfig {
    export enum EventTypeEnum {
        Commit = "CommitEvent",
        Review = "ReviewEvent",
        Season = "SeasonEvent"
    }
}

