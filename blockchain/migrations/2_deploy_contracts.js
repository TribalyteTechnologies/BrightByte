var Bright = artifacts.require("./Bright.sol");
var Commits = artifacts.require("./Commits.sol");
var Root = artifacts.require("./Root.sol");
var Reputation = artifacts.require("./Reputation.sol");
var MigrationLib = artifacts.require("./MigrationLib.sol");
var BrightModels = artifacts.require("./BrightModels.sol");
var versionJSON = require("../../version.json");

const INITIAL_SEASON_INDEX = 3;
const INITIAL_SEASON_TIMESTAMP = 1550047598;
var currentVersion = versionJSON.version;

module.exports = function(deployer) {
    deployer.deploy(BrightModels)
    .then(function(){
        return deployer.link(BrightModels, MigrationLib);
    })
    .then(function(){
        return deployer.deploy(MigrationLib);
    })
    .then(function(){
        return deployer.link(BrightModels, Bright);
    })
    .then(function(){
        return deployer.link(MigrationLib, Bright);
    })
    .then(function(){
        return deployer.deploy(Bright);
    })
    .then(function(){
        return deployer.deploy(Commits);
    }).then(function() {
        return deployer.deploy(Reputation);
    }).then(function() {
        deployer.link(Reputation, Root);
        return deployer.deploy(Root, Bright.address, Commits.address, INITIAL_SEASON_INDEX, INITIAL_SEASON_TIMESTAMP, currentVersion);
    });
};
