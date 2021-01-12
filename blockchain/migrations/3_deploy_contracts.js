const fs = require("fs")
const Bright = artifacts.require("./Bright.sol");
const Commits = artifacts.require("./Commits.sol");
const BrightByteSettings = artifacts.require("./BrightByteSettings.sol");
const CloudEventDispatcher = artifacts.require("./CloudEventDispatcher.sol");
const Root = artifacts.require("./Root.sol");
const Reputation = artifacts.require("./Reputation.sol");
const BrightModels = artifacts.require("./BrightModels.sol");
const UtilsLib = artifacts.require("./UtilsLib.sol");
const CloudTeamManager = artifacts.require("./CloudTeamManager.sol");
const CloudBBFactory = artifacts.require("./CloudBrightByteFactory.sol");
const ProxyManager = artifacts.require("./ProxyManager.sol");
const CloudProjectStore = artifacts.require("./CloudProjectStore.sol");
const BrightDeployerLib = artifacts.require("./BrightDeployerLib.sol");
const CommitsDeployerLib = artifacts.require("./CommitsDeployerLib.sol");
const BrightByteSettingsDeployerLib = artifacts.require("./BrightByteSettingsDeployerLib.sol");
const RootDeployerLib = artifacts.require("./RootDeployerLib.sol");
const BrightDictionary = artifacts.require("./BrightDictionary.sol");
const scVersionObj = require("../../version.json");

const TEAM_UID = 1;
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const USER_ADMIN = EMPTY_ADDRESS;
const SEASON_LENGTH_DAYS = 15;
const CONTRACT_INFO_PATH = "./migrations/ContractsInfo.json";
const currentVersion = scVersionObj.version;
const versionContract = parseInt(scVersionObj.versionContract);


module.exports = async function (deployer, network, accounts) {
    const OWNER_ACCOUNT = accounts[0];
    const INITIALIZER_ACCOUNT = accounts[1];

    console.log("The owner accoutn is:", OWNER_ACCOUNT);
    console.log("The initializer account is:", INITIALIZER_ACCOUNT);

    await deployer.link(BrightModels, Bright);
    await deployer.link(UtilsLib, Bright);
    await deployer.deploy(Bright);
    await deployer.link(UtilsLib, Commits);
    await deployer.deploy(Commits);
    await deployer.deploy(BrightByteSettings);
    let eventDispatcher = await deployer.deploy(CloudEventDispatcher);
    await deployer.link(Reputation, Root);
    await deployer.deploy(Root, Bright.address, Commits.address, BrightByteSettings.address, CloudEventDispatcher.address, USER_ADMIN, TEAM_UID, SEASON_LENGTH_DAYS);

    let cloudProjectStore = await deployer.deploy(CloudProjectStore, EMPTY_ADDRESS);
    let bbDictionary = await deployer.deploy(BrightDictionary);
    await bbDictionary.initialize(currentVersion);
    await deployer.link(BrightDeployerLib, CloudBBFactory);
    await deployer.link(CommitsDeployerLib, CloudBBFactory);
    await deployer.link(BrightByteSettingsDeployerLib, CloudBBFactory);
    await deployer.link(RootDeployerLib, CloudBBFactory);
    await deployer.link(UtilsLib, CloudTeamManager);
    let teamManager = await deployer.deploy(CloudTeamManager);
    let bbFactory = await deployer.deploy(CloudBBFactory);
    await bbFactory.initialize(versionContract, CloudTeamManager.address);
    await teamManager.initialize(CloudBBFactory.address, SEASON_LENGTH_DAYS);
    let proxyManager = await deployer.deploy(ProxyManager);
    await proxyManager.initialize(versionContract, teamManager.address, { from: OWNER_ACCOUNT });
    await cloudProjectStore.initialize(CloudTeamManager.address);

    eventDispatcher.addNewOwner(CloudBBFactory.address, { from: OWNER_ACCOUNT });
};

function saveAddresesInfo(obj) {
    fs.writeFileSync(CONTRACT_INFO_PATH, JSON.stringify(obj));
}
