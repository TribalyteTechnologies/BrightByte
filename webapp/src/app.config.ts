import { default as NETWORK_CONFIG_CUSTOM } from "./app.config.custom";
import { SocketIoConfig } from "ng-socket-io";

export class AppConfig {

    public static readonly LOG_DEBUG = true;
    public static readonly IS_CUSTOM_NET = false;

    public static readonly DEFAULT_LANGUAGE = "en";
    public static readonly DEFAULT_DATE_FORMAT = "en-EU";
    public static readonly USER_LANG_STORAGE_KEY = "brightbyteUserLang";
    public static readonly AVAILABLE_LANGUAGE_KEYS = ["en", "es"];
    public static readonly UPDATE_CHECK_INTERVAL_MINS = 10;

    public static readonly NETWORK_CONFIG_LOCALHOST = [{
        gasLimit: 6721975,
        gasPrice: 0,
        netId: 5777,
        urlNode: "http://127.0.0.1:7545"
    }];
    public static readonly SERVER_BASE_URL = "https://localhost:3000";
    public static readonly SERVER_NETWORK_CONFIG: SocketIoConfig = { url: AppConfig.SERVER_BASE_URL, options: {} };
    
    public static readonly PROFILE_IMAGE_URL = AppConfig.SERVER_BASE_URL + "/profile-image/";
    public static readonly TEAM_API = AppConfig.SERVER_BASE_URL + "/team/";
    public static readonly WORKSPACE_PATH = "/workspace/";
    public static readonly AVATAR_STATUS_PATH = "/status/";
    public static readonly INVITATION_PATH = "/sendInvitation/";
    public static readonly IDENTICON_URL = "https://avatars.dicebear.com/v2/identicon/";
    public static readonly IDENTICON_FORMAT = ".svg";
    public static readonly BRIGHTBYTE_LANDING_PAGE = "http://www.brightbyteapp.com/";

    public static readonly BRIGHT_CONTRACT_PATH = "../assets/build/Bright.json";
    public static readonly COMMITS_CONTRACT_PATH = "../assets/build/Commits.json";
    public static readonly ROOT_CONTRACT_PATH = "../assets/build/Root.json";
    public static readonly TEAM_MANAGER_CONTRACT_PATH = "../assets/build/CloudTeamManager.json";
    public static readonly BB_FACTORY_CONTRACT_PATH = "../assets/build/CloudBrightByteFactory.json";

    public static readonly BRIGHT_CONTRACT_INDEX = 0;
    public static readonly COMMITS_CONTRACT_INDEX = 1;
    public static readonly ROOT_CONTRACT_INDEX = 3;

    public static readonly NETWORK_CONFIG = AppConfig.IS_CUSTOM_NET ? 
        AppConfig.shuffle(NETWORK_CONFIG_CUSTOM.configList) : AppConfig.NETWORK_CONFIG_LOCALHOST;
    public static CURRENT_NODE_INDEX = 0;
    public static readonly MAX_REVIEWER_COUNT = 4;
    public static readonly OPTIMISTIC_SCORE_MULTIPLY_FACTOR = 10;
    public static readonly SCORE_DIVISION_FACTOR = 100;
    public static readonly WEIGHT_REPUTATION_FACTOR = 1000000000000;
    public static readonly COMMIT_SCORE_DIVISION_FACTOR = 1000000000;
    public static readonly SECS_TO_MS = 1000;
    public static readonly N_USER_RANKING_LIST = 5;
    public static readonly COMMIT_WEIGHT = 0.3;
    public static readonly REVIEW_WEIGHT = 0.7;
    public static readonly MIN_TO_SECS = 60;
    public static readonly HOUR_TO_SECS = AppConfig.MIN_TO_SECS * 60;
    public static readonly DAY_TO_SECS = AppConfig.HOUR_TO_SECS * 24;
    public static readonly REPUTATION_FACTOR = 1000;
    public static readonly FIRST_QUALIFYING_SEASON = 0;
    public static readonly COMMITS_BLOCK_SIZE = 20;
    public static readonly EMPTY_COMMIT_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";
    public static readonly EMPTY_TEAM_ID = 0;
    public static readonly DEFAULT_INVITATION_EXP_IN_SECS = 60 * 60 * 24 * 7;
    public static readonly MAX_SEASON_LENGTH_DAYS = 365 * 10;
    public static readonly MIN_SEASON_LENGTH_DAYS = 1;
    public static readonly VALUES_ARENT_VALID_ERROR_IDENTIFIER = "Returned values aren't valid, did it run Out of Gas?";
    public static readonly NOT_CONVERTIBLE_STRING_ERROR_IDENTIFIER = "The returned value is not a convertible string";
    public static readonly ERROR_IDENTIFIERS_ARRAY = [
        AppConfig.NOT_CONVERTIBLE_STRING_ERROR_IDENTIFIER, AppConfig.VALUES_ARENT_VALID_ERROR_IDENTIFIER];
    
    
    public static readonly STATUS_OK = "OK";
    public static readonly STATUS_NOT_FOUND = "Not Found";

    public static readonly IS_SHARING_ENABLED = true;

    public static readonly StorageKey = {
        USERNAME: "brightUser",
        PASSWORD: "brightPassword",
        BITBUCKETUSERTOKEN: "brightBitbucketUserToken",
        USERMAILS: "brightEmails",
        LASTPAGE: "brightPage",
        MIGRATION: "brightMigration",
        REVIEWFILTER: "brightReviewFilter",
        REVIEWPENDINGFILTER: "brightReviewPendingFilter",
        COMMITFILTER: "brightCommitFilter",
        COMMITPENDINGFILTER: "brightCommitPendingFilter",
        CURRENTSEASONINDEX: "brightCurrentSeasonIndex",
        LOCALSTORAGEVERSION: "brightLocalStorageVerison",
        REGISTERTUTORIALVISITED: "brightRegisterTutorialVisited",
        AFTERLOGINTUTORIALVISITED: "brightAfterLoginTutorialVisited",
        APPJUSTUPDATED: "brightAppJustUpdated"
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

export namespace AppConfig {
    export enum AchievementType{
        Commit = 0,
        Review = 1,
        TimedReview = 2,
        Season = 3
    }

    export enum UserType{
        NotRegistered = 0,
        Admin = 1,
        Member = 2
    }
}
