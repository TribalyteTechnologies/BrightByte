const Web3 = require("web3");
var Contract = require("truffle-contract");
var CloudTeamManagerJson = require("../build/contracts/CloudTeamManager.json");
var ProxyJson = require("../build/contracts/AdminUpgradeabilityProxy.json");
var CloudBbFactoryJson = require("../build/contracts/CloudBrightByteFactory.json");
var Proxy = Contract(ProxyJson);
var CloudTeamManager = Contract(CloudTeamManagerJson);
var CloudBbFactory = Contract(CloudBbFactoryJson);

const OWNER_ADDRESS = "0x0";
var provider = new Web3.providers.HttpProvider("http://localhost:7545");


async function start() {
    let cloudTeamManagerAddress = "0x0";
    let cloudBbFactoryAddress = "0x0";
    await updateContract(CloudTeamManager, cloudTeamManagerAddress);
    await updateContract(CloudBbFactory, cloudBbFactoryAddress);
}

async function updateContract(contractType, proxyContractAddress) {
    console.log("Old contract address is: ", proxyContractAddress);
    contractType.setProvider(provider);
    let newContract = await contractType.new({from: OWNER_ADDRESS });
    let proxyContract = await Proxy.at(proxyContractAddress);
    await proxyContract.upgradeTo(newContract.address, {from: OWNER_ADDRESS });
    console.log("New contract address is: ", newContract.address);
}

Proxy.setProvider(provider);
start();