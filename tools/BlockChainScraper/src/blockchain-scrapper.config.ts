export class BlockchainScrapperConfig {

    public static readonly HTTP_OR_WS_NODE_URL  = "ws://localhost:4546/"

    public static readonly FROM_BLOCK_NUMBER = 12040000;
    public static readonly TO_BLOCK_NUMBER = 12241982;
    public static readonly USER_FILE_NAME = "usertransactions.json";
    public static readonly USER_FILE_PATH = "./" + BlockchainScrapperConfig.USER_FILE_NAME;
}
