export class AppConfig {

    public static readonly LOG_DEBUG = true;
    public static readonly IS_ALASTRIA = false;

    public static readonly DEFAULT_LANGUAGE = "en";
    public static readonly DEFAULT_DATE_FORMAT = "en-EU";
    public static readonly USER_LANG_STORAGE_KEY = "brightbyteUserLang";
    public static readonly AVAILABLE_LANGUAGE_KEYS = ["en", "es"];

    public static readonly NETWORK_CONFIG_ALASTRIA = {
        gasLimit: 2000000,
        gasPrice: 0,
        netId: 82584648528,
        urlNode: "http://52.209.188.78:22000"
    };

    public static readonly NETWORK_CONFIG_LOCALHOST = {
        gasLimit: 2000000,
        gasPrice: 10,
        netId: 4447,
        urlNode: "http://localhost:9545"
    };

    public static readonly NETWORK_CONFIG = AppConfig.IS_ALASTRIA ? 
    AppConfig.NETWORK_CONFIG_ALASTRIA : AppConfig.NETWORK_CONFIG_LOCALHOST;

}
