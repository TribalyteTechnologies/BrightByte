var Reputation = artifacts.require("./Reputation.sol");
var BrightModels = artifacts.require("./BrightModels.sol");
var UtilsLib = artifacts.require("./UtilsLib.sol");
var BrightDeployerLib = artifacts.require("./BrightDeployerLib.sol");
var CommitsDeployerLib = artifacts.require("./CommitsDeployerLib.sol");
var BrightByteSettingsDeployerLib = artifacts.require("./BrightByteSettingsDeployerLib.sol");
var RootDeployerLib = artifacts.require("./RootDeployerLib.sol");

module.exports = async function (deployer) {
    await deployer.deploy(UtilsLib);
    await deployer.deploy(BrightModels);
    await deployer.deploy(Reputation);
    await deployer.deploy(BrightByteSettingsDeployerLib);
    await deployer.link(UtilsLib, BrightDeployerLib);
    await deployer.link(UtilsLib, CommitsDeployerLib);
    await deployer.deploy(BrightDeployerLib);
    await deployer.deploy(CommitsDeployerLib);
    await deployer.link(Reputation, RootDeployerLib);
    await deployer.deploy(RootDeployerLib);
};
