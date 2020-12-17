const Web3 = require("web3");
const ProxyManagerJson = require("../build/contracts/ProxyManager.json");
const CloudTeamManagerJson = require("../build/contracts/CloudTeamManager.json");
const CloudEventJson = require("../build/contracts/CloudEventDispatcher.json");
const SMART_CONTRACT_VERSION = require("../../version.json");
const CURRENT_VERSION = SMART_CONTRACT_VERSION.versionContract;

const OWNER_ADDRESS = "0xA47b95E415516a34469540e50FC0c0A539ED0bc9";
const OWNER_EVENT = "0x94c519c57bc27B75C88bDf8c68181C5D2F7340d8";
const PROXY_MANAGER_ADDRESS = "0xcc6A01C89c36BC95433194B4dD6f8145705581EC";
const CLOUD_EVENT_ADDRESS = "0x5c18abFc841E2b3dbD00f49637416736e1298564";
const NEW_TEAM_MANAGER_ADDRESS = "0xf0D0F097d130C8dB43e1a38780F2b0696a863325";
const NEW_BB_FACTORY_ADDRESS = "0x17357bb21B28d7B6005732fD28CdF273131B66FC";
const URL_PROVIDER = "http://localhost:7545";

let proxyContract;
let teamManager;
let cloudEvent;

async function setNewVersion() {
    await init();

    await proxyContract.methods.setNewVersion(CURRENT_VERSION, NEW_TEAM_MANAGER_ADDRESS).send({ from: OWNER_ADDRESS });
    let currentVersion = await proxyContract.methods.getCurrentVersion().call({ from: OWNER_ADDRESS });
    console.log("The current version is:", currentVersion);

    await cloudEvent.methods.addNewOwner(NEW_TEAM_MANAGER_ADDRESS).send({ from: OWNER_EVENT });
    await cloudEvent.methods.addNewOwner(NEW_BB_FACTORY_ADDRESS).send({ from: OWNER_EVENT });
    console.log("The contracts are allowed to add new contracts in, ", CLOUD_EVENT_ADDRESS);

    await teamManager.methods.setEventDispatcher(CLOUD_EVENT_ADDRESS).send({ from: OWNER_ADDRESS });
    cloudEventAddress = await teamManager.methods.getEventDispatcherAddress().call({ from: OWNER_ADDRESS });
    console.log("The current cloud event address is:", cloudEventAddress);
}

async function init() {
    const web3 = new Web3(new Web3.providers.HttpProvider(URL_PROVIDER));
    proxyContract = new web3.eth.Contract(ProxyManagerJson.abi, PROXY_MANAGER_ADDRESS);
    cloudEvent = new web3.eth.Contract(CloudEventJson.abi, CLOUD_EVENT_ADDRESS);
    teamManager = new web3.eth.Contract(CloudTeamManagerJson.abi, NEW_TEAM_MANAGER_ADDRESS);
    console.log("Enviroment ready to set new version:");
}

setNewVersion();
