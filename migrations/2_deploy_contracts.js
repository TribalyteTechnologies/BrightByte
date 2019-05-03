var Bright = artifacts.require("./Bright.sol");
var Commits = artifacts.require("./Commits.sol");
var Root = artifacts.require("./Root.sol");

module.exports = function(deployer) {
    console.log("Deploying Bright contract");
    deployer.deploy(Bright)
    .then(function(){
        console.log("Deploying Commits contract");
        return deployer.deploy(Commits);
    }).then(function() {
        console.log("Deploying Root contract. Addresses: ", [Bright.address, Commits.address]);
        return deployer.deploy(Root, Bright.address, Commits.address, 1, 1550047598);
      });
};
