var contract = require("truffle-contract");
var CloudTeamManagerJson = require("../build/contracts/CloudTeamManager.json");
var ProxyJson = require("../build/contracts/AdminUpgradeabilityProxy.json");
var CloudBBFactoryJson = require("../build/contracts/CloudBrightByteFactory.json");

var Proxy = contract(ProxyJson);
var CloudTeamManager = contract(CloudTeamManagerJson);
var CloudBBFactory = contract(CloudBBFactoryJson);

module.exports = async function (deployer, network, accounts) {
    let cloudTeamManagerAddress = "0x0";
    let cloudBBFactoryAddress = "0x0";
    await updateContract(CloudTeamManager, cloudTeamManagerAddress);
    await updateContract(CloudBBFactory, cloudBBFactoryAddress);
};

async function updateContract(contract, proxyContractAddress) {
    let newContract = await contract.new();
    let proxyContract = await Proxy.at(proxyContractAddress);
    await proxyContract.upgradeTo(newContract.address);
}
