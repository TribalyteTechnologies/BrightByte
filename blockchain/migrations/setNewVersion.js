const Web3 = require("web3");
const ProxyManagerJson = require("../build/contracts/ProxyManager.json");
const CloudTeamManagerJson = require("../build/contracts/CloudTeamManager.json");
const CloudEventJson = require("../build/contracts/CloudEventDispatcher.json");
const SMART_CONTRACT_VERSION = require("../../version.json");
const CURRENT_VERSION = SMART_CONTRACT_VERSION.versionContract;

const OWNER_ADDRESS = "0x0";
const OWNER_EVENT = "0x0";
const PROXY_MANAGER_ADDRESS = "0x0";
const CLOUD_EVENT_ADDRESS = "0x0";
const NEW_TEAM_MANAGER_ADDRESS = "0x0";
const NEW_BB_FACTORY_ADDRESS = "0x0";
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
