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
var BrightDeployerLib = artifacts.require("./BrightDeployerLib.sol");
var CommitsDeployerLib = artifacts.require("./CommitsDeployerLib.sol");
var BrightByteSettingsDeployerLib = artifacts.require("./BrightByteSettingsDeployerLib.sol");
var RootDeployerLib = artifacts.require("./RootDeployerLib.sol");
var scVersionObj = require("../../version.json");

const TEAM_UID = 1;
const USER_ADMIN = "0x0000000000000000000000000000000000000000";
const SEASON_LENGTH_DAYS = 15;
var currentVersion = scVersionObj.version;

module.exports = async function(deployer) {

    await deployer.link(BrightModels, Bright);
    await deployer.link(UtilsLib, Bright);
    await deployer.deploy(Bright);
    await deployer.link(UtilsLib, Commits);
    await deployer.deploy(Commits);   
    await deployer.deploy(BrightByteSettings);
    await deployer.deploy(CloudEventDispatcher, "0x0000000000000000000000000000000000000000");
    await deployer.link(Reputation, Root);
    await deployer.deploy(Root, Bright.address, Commits.address, BrightByteSettings.address, CloudEventDispatcher.address, USER_ADMIN, TEAM_UID, SEASON_LENGTH_DAYS);
        

    await deployer.link(BrightDeployerLib, CloudBBFactory);
    await deployer.link(CommitsDeployerLib, CloudBBFactory);
    await deployer.link(BrightByteSettingsDeployerLib, CloudBBFactory);
    await deployer.link(RootDeployerLib, CloudBBFactory);
    await deployer.link(UtilsLib, CloudTeamManager);
    let teamManager = await deployer.deploy(CloudTeamManager);
    let bbFactory = await deployer.deploy(CloudBBFactory);
    await bbFactory.initialize(currentVersion, CloudTeamManager.address);
    await teamManager.initialize(CloudBBFactory.address, SEASON_LENGTH_DAYS);
};
