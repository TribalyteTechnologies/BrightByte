const Web3 = require("web3");
const axios = require("axios");

const HTTP_URL_NODE = "http://domain.com/rpc";
const BrightContractUrl = "http://domain/assets/build/Bright.json";
const BRIGHT_CONTRACT_ADDRESS = "0x0";
const USER_ADDRESS = "0x0";

async function start() {
    console.log(`[${new Date().toISOString()}] Running BrightByte timeout workaround`);
    const web3 = await new Web3(new Web3.providers.HttpProvider(HTTP_URL_NODE));
    const response = await axios({ url: BrightContractUrl, method: 'GET' ,responseType: "blob"});
    const BrightContract = response.data.abi;

    const brightContract = new web3.eth.Contract(BrightContract, BRIGHT_CONTRACT_ADDRESS);
    const repRes = await brightContract.methods.getUserSeasonReputation(USER_ADDRESS, 1).call({ from: USER_ADDRESS });
    console.log(`[${new Date().toISOString()}] User reputation result:`, repRes);
}

start();