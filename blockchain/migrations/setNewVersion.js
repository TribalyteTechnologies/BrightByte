const Web3 = require("web3");
const ProxyManagerJson = require("../build/contracts/ProxyManager.json");
const SMART_CONTRACT_VERSION = require("../../version.json");
const CURRENT_VERSION = SMART_CONTRACT_VERSION.version;

const OWNER_ADDRESS = "0x0";
const PROXY_MANAGER_ADDRESS = "0x0";
const NEW_TEAM_MANAGER_ADDRESS = "0x0";
const URL_PROVIDER = "http://localhost:7545";

async function setNewVersion() {
    const web3 = new Web3(new Web3.providers.HttpProvider(URL_PROVIDER));
    const proxyContract = new web3.eth.Contract(ProxyManagerJson.abi, PROXY_MANAGER_ADDRESS);
    await proxyContract.methods.setNewVersion(CURRENT_VERSION, NEW_TEAM_MANAGER_ADDRESS).send({ from: OWNER_ADDRESS });
    let currentVersion = await proxyContract.methods.getCurrentVersion().call({ from: OWNER_ADDRESS });
    console.log("The current version is:", currentVersion);
}

setNewVersion();
