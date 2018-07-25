import { default as NETWORK_CONFIG_CUSTOM } from "./app.config.custom";

export class AppConfig {

    public static readonly LOG_DEBUG = true;
    public static readonly IS_CUSTOM_NET = false;

    public static readonly DEFAULT_LANGUAGE = "en";
    public static readonly DEFAULT_DATE_FORMAT = "en-EU";
    public static readonly USER_LANG_STORAGE_KEY = "brightbyteUserLang";
    public static readonly AVAILABLE_LANGUAGE_KEYS = ["en", "es"];

    public static readonly NETWORK_CONFIG_LOCALHOST = {
        gasLimit: 2000000,
        gasPrice: 10,
        netId: 4447,
        urlNode: "http://localhost:9545"
    };

    public static readonly NETWORK_CONFIG = AppConfig.IS_CUSTOM_NET ?
        NETWORK_CONFIG_CUSTOM : AppConfig.NETWORK_CONFIG_LOCALHOST;
    public static readonly MAX_REVIEWER_COUNT = 4;
    public static readonly SCORE_DIVISION_FACTOR = 100;
    public static readonly N_USER_RANKING_LIST = 5;

}
