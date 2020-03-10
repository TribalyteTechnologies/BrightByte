export class MigrationConfig {
    public static readonly HTTP_URL_NODE  = "http://localhost/7545"
    public static readonly WS_URL_NODE  = "ws://localhost/ws"
    public static readonly ORIGIN_HEADER = "test.com";
    public static readonly NETID = 83584648538;
    public static readonly GAS_PRICE = 0;
    public static readonly GAS_LIMIT = 2000000;
    public static readonly BRIGHT_CONTRACT_URL  = "http://localhost:8101/assets/build/Bright.json";
    public static readonly COMMIT_CONTRACT_URL  = "http://localhost:8101/assets/build/Commits.json";
    public static readonly BRIGHT_OLD_CONTRACT_URL  = "http://localhost:8100/assets/build/Bright.json";
    public static readonly COMMIT_OLD_CONTRACT_URL  = "http://localhost:8100/assets/build/Commits.json";
    public static readonly NUMBER_SET_COMMITS = 5;
    public static readonly INITIAL_SEASON_TIMESTAMP = 1550047598;
    public static readonly WEIGHT_FACTOR = 10000;
    public static readonly WEIGHT_REPUTATION_FACTOR = 100000000;
    public static readonly NUMBER_SET_SEASON_COMMITS = 25;
    public static readonly INVALID_USERS_ADDRESS = "0x0000000000000000000000000000000000000000";
    public static readonly EXCLUDED_USERS_ADDRESS = ["0x0000000000000000000000000000000000000000"];
    public static readonly USER_ADDRESS = "0x0000000000000000000000000000000000000000";
    public static readonly PRIVATE_KEY_ACCOUNT = "0x0";
    public static readonly PERCENTAGE = 100;
    public static readonly INITIAL_SEASON_MULTIPLE_CRITERIA = 3;
    public static readonly INITIAL_SEASON_THRESHOLD = 4;
    public static readonly COMMIT_THRESHOLDS = [15, 35];
    public static readonly REVIEW_THRESHOLDS = [15, 45];
}
