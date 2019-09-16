const Migrations = artifacts.require("Migrations");
const Web3 = require('web3');

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};