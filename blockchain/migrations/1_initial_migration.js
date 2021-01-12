const Web3 = require("web3");
const TruffleConfig = require("../truffle-config");

var Migrations = artifacts.require("./Migrations.sol");


module.exports = function(deployer, network, addresses) {
	const config = TruffleConfig.networks[network];

	console.log(">> Deploying migrations contract");
	deployer.deploy(Migrations);
};
