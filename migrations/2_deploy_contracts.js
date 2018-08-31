var Bright = artifacts.require("./Bright.sol");
var Commits = artifacts.require("./Commits.sol");
var Root = artifacts.require("./Root.sol");
module.exports = function(deployer) {
    deployer.deploy([Bright, Commits]).then(function() {
        return deployer.deploy(Root, Bright.address, Commits.address);
      });
};
