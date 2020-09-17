const fs = require("fs")
var Bright = artifacts.require("./Bright.sol");
var Commits = artifacts.require("./Commits.sol");
var BrightByteSettings = artifacts.require("./BrightByteSettings.sol");
var CloudEventDispatcher = artifacts.require("./CloudEventDispatcher.sol");
var Root = artifacts.require("./Root.sol");
var Reputation = artifacts.require("./Reputation.sol");
var BrightModels = artifacts.require("./BrightModels.sol");
var UtilsLib = artifacts.require("./UtilsLib.sol");
var CloudTeamManager = artifacts.require("./CloudTeamManager.sol");
var CloudBBFactory = artifacts.require("./CloudBrightByteFactory.sol");
var ProxyManager = artifacts.require("./ProxyManager.sol");
var CloudProjectStore = artifacts.require("./CloudProjectStore.sol");
var BrightDeployerLib = artifacts.require("./BrightDeployerLib.sol");
var CommitsDeployerLib = artifacts.require("./CommitsDeployerLib.sol");
var BrightByteSettingsDeployerLib = artifacts.require("./BrightByteSettingsDeployerLib.sol");
var RootDeployerLib = artifacts.require("./RootDeployerLib.sol");
var BrightDictionary = artifacts.require("./BrightDictionary.sol");
var Proxy = artifacts.require("./contracts/openzeppelin/upgradeability/AdminUpgradeabilityProxy.sol");
var scVersionObj = require("../../version.json");
const TruffleConfig = require("../truffle-config");

const TEAM_UID = 1;
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const USER_ADMIN = EMPTY_ADDRESS;
const SEASON_LENGTH_DAYS = 15;
const CONTRACT_INFO_PATH = "./migrations/ContractsInfo.json";
var currentVersion = scVersionObj.version;

module.exports = async function (deployer, network, accounts) {
    const CONFIG = TruffleConfig.networks[network];
    const OWNER_ACCOUNT = accounts[0];
    const INITIALIZER_ACCOUNT = accounts[1];

    await deployer.link(BrightModels, Bright);
    await deployer.link(UtilsLib, Bright);
    await deployer.deploy(Bright);
    await deployer.link(UtilsLib, Commits);
    await deployer.deploy(Commits);
    await deployer.deploy(BrightByteSettings);
    await deployer.deploy(CloudEventDispatcher, EMPTY_ADDRESS);
    await deployer.link(Reputation, Root);
    await deployer.deploy(Root, Bright.address, Commits.address, BrightByteSettings.address, CloudEventDispatcher.address, USER_ADMIN, TEAM_UID, SEASON_LENGTH_DAYS);
    await deployer.deploy(BrightDictionary);
    await deployer.link(BrightDeployerLib, CloudBBFactory);
    await deployer.link(CommitsDeployerLib, CloudBBFactory);
    await deployer.link(BrightByteSettingsDeployerLib, CloudBBFactory);
    await deployer.link(RootDeployerLib, CloudBBFactory);
    await deployer.link(UtilsLib, CloudTeamManager);
    let teamManager = await deployer.deploy(CloudTeamManager);
    let bbFactory = await deployer.deploy(CloudBBFactory);
    await bbFactory.initialize(currentVersion, CloudTeamManager.address);
    await teamManager.initialize(CloudBBFactory.address, SEASON_LENGTH_DAYS);

    let cloudBBFactory = await CloudBBFactory.new();
    let proxyCloudBBFactory = await Proxy.new(cloudBBFactory.address, OWNER_ACCOUNT, []);
    cloudBBFactory = await CloudBBFactory.at(proxyCloudBBFactory.address);
    console.log("CloudBBFactory deployed: ", proxyCloudBBFactory.address);

    let cloudTeamManager = await CloudTeamManager.new();
    let proxyCloudTeamManager = await Proxy.new(cloudTeamManager.address, OWNER_ACCOUNT, []);
    cloudTeamManager = await CloudTeamManager.at(proxyCloudTeamManager.address);
    console.log("CloudTeamManager deployed: ", proxyCloudTeamManager.address);

    let cloudProjectStore = await CloudProjectStore.new(EMPTY_ADDRESS);
    let proxyCloudProjectStore = await Proxy.new(cloudProjectStore.address, OWNER_ACCOUNT, []);
    cloudProjectStore = await CloudProjectStore.at(proxyCloudProjectStore.address);
    console.log("CloudProjectStore deployed: ", cloudProjectStore.address);

    let brightDictionary = await BrightDictionary.new();
    let proxyBrightDictionary = await Proxy.new(brightDictionary.address, OWNER_ACCOUNT, []);
    brightDictionary = await BrightDictionary.at(proxyBrightDictionary.address);
    console.log("BrightDictionary deployed: ", proxyBrightDictionary.address);


    await cloudBBFactory.initialize(currentVersion, cloudTeamManager.address, { from: INITIALIZER_ACCOUNT });
    await cloudTeamManager.initialize(cloudBBFactory.address, SEASON_LENGTH_DAYS, { from: INITIALIZER_ACCOUNT });
    await cloudProjectStore.initialize(cloudTeamManager.address, { from: INITIALIZER_ACCOUNT });
    await brightDictionary.initialize(currentVersion, { from: INITIALIZER_ACCOUNT });


    let proxyManager = await deployer.deploy(ProxyManager);
    await proxyManager.initialize(currentVersion, cloudTeamManager.address, { from: OWNER_ACCOUNT });

    let contractsInfo = {};
    contractsInfo[CloudBBFactory.contract_name] = { address: cloudBBFactory.address, netId: CONFIG.network_id };
    contractsInfo[CloudTeamManager.contract_name] = { address: cloudTeamManager.address, netId: CONFIG.network_id };
    contractsInfo[BrightDictionary.contract_name] = { address: brightDictionary.address, netId: CONFIG.network_id };
    saveAddresesInfo(contractsInfo);
};

function saveAddresesInfo(obj) {
    fs.writeFileSync(CONTRACT_INFO_PATH, JSON.stringify(obj));
}
