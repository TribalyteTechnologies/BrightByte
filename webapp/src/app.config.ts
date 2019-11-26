import { default as NETWORK_CONFIG_CUSTOM } from "./app.config.custom";
import { SocketIoConfig } from "ng-socket-io";

export class AppConfig {

    public static readonly LOG_DEBUG = true;
    public static readonly IS_CUSTOM_NET = true;

    public static readonly DEFAULT_LANGUAGE = "en";
    public static readonly DEFAULT_DATE_FORMAT = "en-EU";
    public static readonly USER_LANG_STORAGE_KEY = "brightbyteUserLang";
    public static readonly AVAILABLE_LANGUAGE_KEYS = ["en", "es"];
    public static readonly UPDATE_CHECK_INTERVAL_MINS = 10;

    public static readonly NETWORK_CONFIG_LOCALHOST = [{
        gasLimit: 2000000,
        gasPrice: 10,
        netId: 4447,
        urlNode: "HTTP://127.0.0.1:9545"
    }];
    public static readonly SERVER_BASE_URL = "http://localhost:3000";
    public static readonly SERVER_NETWORK_CONFIG: SocketIoConfig = { url: AppConfig.SERVER_BASE_URL, options: {} };
    
    public static readonly PROFILE_IMAGE_URL = AppConfig.SERVER_BASE_URL + "/profile-image/";
    public static readonly AVATAR_STATUS_PATH = "/status/";
    public static readonly IDENTICON_URL = "https://avatars.dicebear.com/v2/identicon/";
    public static readonly IDENTICON_FORMAT = ".svg";

    public static readonly NETWORK_CONFIG = AppConfig.IS_CUSTOM_NET ? 
    AppConfig.shuffle(NETWORK_CONFIG_CUSTOM.configList) : AppConfig.NETWORK_CONFIG_LOCALHOST;
    public static CURRENT_NODE_INDEX = 0;
    public static readonly MAX_REVIEWER_COUNT = 4;
    public static readonly SCORE_DIVISION_FACTOR = 100;
    public static readonly REPUTATION_DIVISION_FACTOR = 1000000;    
    public static readonly SECS_TO_MS = 1000;
    public static readonly N_USER_RANKING_LIST = 5;
    public static readonly COMMIT_WEIGHT = 0.6;
    public static readonly REVIEW_WEIGHT = 0.4;
    public static readonly MIN_TO_SECS = 60;
    public static readonly HOUR_TO_SECS = AppConfig.MIN_TO_SECS * 60;
    public static readonly DAY_TO_SECS = AppConfig.HOUR_TO_SECS * 24;
    public static readonly REPUTATION_FACTOR = 1000;
    public static readonly MIN_REVIEW_QUALIFY = 15;
    public static readonly MIN_COMMIT_QUALIFY = 15;
    public static readonly FIRST_QUALIFYING_SEASON = 4;
    
    public static readonly STATUS_OK = "OK";
    public static readonly STATUS_NOT_FOUND = "Not Found";

    public static readonly StorageKey = {
        USERNAME: "brightUser",
        PASSWORD: "brightPassword",
        USERMAILS: "brightEmails",
        LASTPAGE: "brightPage",
        MIGRATION: "brightMigration",
        REVIEWFILTER: "brightReviewFilter",
        REVIEWPENDINGFILTER: "brightReviewPendingFilter",
        COMMITFILTER: "brightCommitFilter",
        COMMITPENDINGFILTER: "brightCommitPendingFilter",
        LOCALSTORAGEVERSION: "brightLocalStorageVerison"
    };

    public static readonly UrlKey = {
        REVIEWID: "reviewId",
        COMMITID: "commitId"
    };

    private static shuffle(array: Array<any>): Array<any> {
        let currentIndex = array.length;
        while (0 !== currentIndex) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            let temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }
}

