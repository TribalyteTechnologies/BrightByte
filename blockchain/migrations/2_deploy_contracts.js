var Bright = artifacts.require("./Bright.sol");
var Commits = artifacts.require("./Commits.sol");
var Threshold = artifacts.require("./Threshold.sol");
var CloudEventDispatcher = artifacts.require("./CloudEventDispatcher.sol");
var Root = artifacts.require("./Root.sol");
var Reputation = artifacts.require("./Reputation.sol");
var BrightByteLib = artifacts.require("./BrightByteLib.sol");
var BrightModels = artifacts.require("./BrightModels.sol");
var UtilsLib = artifacts.require("./UtilsLib.sol");
var CloudTeamManager = artifacts.require("./CloudTeamManager.sol");
var CloudBBFactory = artifacts.require("./CloudBrightByteFactory.sol");
var BrightDeployerLib = artifacts.require("./BrightDeployerLib.sol");
var CommitsDeployerLib = artifacts.require("./CommitsDeployerLib.sol");
var ThresholdDeployerLib = artifacts.require("./ThresholdDeployerLib.sol");
var RootDeployerLib = artifacts.require("./RootDeployerLib.sol");
var scVersionObj = require("../../version.json");

const TEAM_UID = 1;
const USER_ADMIN = "0x0000000000000000000000000000000000000000";
const SEASON_LENGTH_DAYS = 15;
var currentVersion = scVersionObj.version;
var teamManagerAddress;

module.exports = function(deployer) {
    deployer.deploy(BrightModels)
    .then(function(){
        return deployer.link(BrightModels, BrightByteLib);
    })
    .then(function(){
        return deployer.deploy(BrightByteLib);
    })
    .then(function(){
        return deployer.deploy(UtilsLib);
    })
    .then(function(){
        return deployer.link(BrightModels, Bright);
    })
    .then(function(){
        return deployer.link(BrightByteLib, Bright);
    })
    .then(function(){
        return deployer.link(UtilsLib, Bright);
    })
    .then(function(){
        return deployer.deploy(Bright);
    })
    .then(function(){
        return deployer.link(UtilsLib, Commits);
    })
    .then(function(){
        return deployer.deploy(Commits);
    })
    .then(function() {
        return deployer.deploy(Reputation);
    })
    .then(function() {
        return deployer.deploy(Threshold);
    }).then(function() {
        return deployer.deploy(CloudEventDispatcher, "0x0000000000000000000000000000000000000000");
    }).then(function() {
        deployer.link(Reputation, Root);
        return deployer.deploy(Root, Bright.address, Commits.address, Threshold.address, CloudEventDispatcher.address, USER_ADMIN, TEAM_UID, SEASON_LENGTH_DAYS);
    })
    .then(function(){
        return deployer.link(BrightByteLib, BrightDeployerLib);
    })
    .then(function(){
        return deployer.link(UtilsLib, BrightDeployerLib);
    })
    .then(function(){
        return deployer.deploy(BrightDeployerLib);
    })
    .then(function(){
        return deployer.link(BrightByteLib, CommitsDeployerLib);
    })
    .then(function(){
        return deployer.link(UtilsLib, CommitsDeployerLib);
    })
    .then(function(){
        return deployer.deploy(CommitsDeployerLib);
    })
    .then(function(){
        return deployer.deploy(ThresholdDeployerLib);
    })
    .then(function(){
        return deployer.link(Reputation, RootDeployerLib);
    })
    .then(function(){
        return deployer.deploy(RootDeployerLib);
    })
    .then(function(){
        return deployer.link(BrightDeployerLib, CloudBBFactory);
    })
    .then(function(){
        return deployer.link(CommitsDeployerLib, CloudBBFactory);
    })
    .then(function(){
        return deployer.link(ThresholdDeployerLib, CloudBBFactory);
    })
    .then(function(){
        return deployer.link(RootDeployerLib, CloudBBFactory);
    })
    .then(function(){
        return deployer.deploy(CloudBBFactory, currentVersion);
    })
    .then(function(){
        return deployer.deploy(CloudTeamManager, CloudBBFactory.address, SEASON_LENGTH_DAYS);
    }).then(function(){
        return CloudTeamManager.deployed();
    }).then(function(teamManager){
        teamManagerAddress = teamManager.address;
        return CloudBBFactory.deployed();
    })
    .then(function(bbFactory){
        return bbFactory.init(teamManagerAddress);
    });
};
