export class BlockchainScrapperConfig {

    public static readonly HTTP_OR_WS_NODE_URL  = "ws://localhost:4546/"

    public static readonly FROM_BLOCK_NUMBER = 12040000;
    public static readonly TO_BLOCK_NUMBER = 12241982;
    public static readonly MINIMUM_CHAR_CODE = 65;
    public static readonly MAXIMUM_CHAR_CODE = 122;
    public static readonly USER_TX_DATA_FILE_NAME = "usertransactions.json";
    public static readonly USER_TX_DATA_FILE_PATH = "./" + BlockchainScrapperConfig.USER_TX_DATA_FILE_NAME;
    public static readonly USER_STATISTICS_FILE_NAME = "userstatistics.json";
    public static readonly USER_STATISTICS_FILE_PATH = "./" + BlockchainScrapperConfig.USER_STATISTICS_FILE_NAME;
}
