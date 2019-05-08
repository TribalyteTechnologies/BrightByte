var Bright = artifacts.require("./Bright.sol");
var Commits = artifacts.require("./Commits.sol");
var Root = artifacts.require("./Root.sol");

const INITIAL_SEASON_INDEX = 1;
const INITIAL_SEASON_TIMESTAMP = 1550047598;

module.exports = function(deployer) {
    console.log("Deploying Bright contract");
    deployer.deploy(Bright)
    .then(function(){
        console.log("Deploying Commits contract");
        return deployer.deploy(Commits);
    }).then(function() {
        console.log("Deploying Root contract. Addresses: ", [Bright.address, Commits.address]);
        return deployer.deploy(Root, Bright.address, Commits.address, INITIAL_SEASON_INDEX, INITIAL_SEASON_TIMESTAMP);
    });
};
