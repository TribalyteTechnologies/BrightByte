export class AppConfig {

    public static readonly LOG_DEBUG = true;

    public static readonly DEFAULT_LANGUAGE = "en";
    public static readonly DEFAULT_DATE_FORMAT = "en-EU";
    public static readonly USER_LANG_STORAGE_KEY = "brightbyteUserLang";
    public static readonly AVAILABLE_LANGUAGE_KEYS = ["en", "es"];

    public static readonly GAS_LIMIT = 2000000;
    public static readonly GASPRICE = 0; //Alastria = 0 and localhost = 10
    public static readonly NET_ID = 82584648528; //In alastria is 82584648528 instead of 4447 thats it is in local
    public static readonly URL_NODE = "http://52.209.188.78:22000" // http://localhost:9545 or http://52.209.188.78:22000

}
