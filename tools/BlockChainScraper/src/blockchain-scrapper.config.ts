export class BlockchainScrapperConfig {

    public static readonly HTTP_OR_WS_NODE_URL  = "ws://localhost:4546/"

    public static readonly FROM_BLOCK_NUMBER = 12240000;
    public static readonly TO_BLOCK_NUMBER = 12241982;
    public static readonly MINIMUN_NUMBER_OF_TX_TO_SHOW = 4;
    public static readonly MINIMUN_NUMBER_OF_TX_TO_PREFERED_DESTINATION = 2;
    public static readonly MINIMUM_CHAR_CODE = 32;
    public static readonly MAXIMUM_CHAR_CODE = 126;
    public static readonly USER_TX_DATA_FILE_NAME = "usertransactions.json";
    public static readonly USER_TX_DATA_FILE_PATH = "./" + BlockchainScrapperConfig.USER_TX_DATA_FILE_NAME;
    public static readonly USER_STATISTICS_FILE_NAME = "userstatistics.json";
    public static readonly USER_STATISTICS_FILE_PATH = "./" + BlockchainScrapperConfig.USER_STATISTICS_FILE_NAME;
}
