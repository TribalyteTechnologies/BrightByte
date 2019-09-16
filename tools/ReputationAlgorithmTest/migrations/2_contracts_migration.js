const reputation = artifacts.require("./Reputation.sol");

module.exports = function(deployer) {
  return deployer.deploy(reputation);
};