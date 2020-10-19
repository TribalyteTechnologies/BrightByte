const Web3 = require("web3");
const axios = require("axios");

const HTTP_URL_NODE = "http://domain.com/rpc";
const BRIGHT_CONTRACT_URL = "http://domain/assets/build/Bright.json";
const COMMIT_CONTRACT_URL = "http://domain/assets/build/Commits.json";
const BRIGHT_CONTRACT_ADDRESS = "0x0";
const COMMIT_CONTRACT_ADDRESS = "0x0";
const USER_ADDRESS = "0x0";
const COMMITS_BLOCK_SIZE = 40;

let brightContract;
let commitContract;

async function init() {
    console.log(`[${new Date().toISOString()}] Running BrightByte timeout workaround`);
    const web3 = await new Web3(new Web3.providers.HttpProvider(HTTP_URL_NODE));

    let response = await axios({ url: BRIGHT_CONTRACT_URL, method: 'GET' ,responseType: "blob"});
    const BrightContract = response.data.abi;
    response = await axios({ url: COMMIT_CONTRACT_URL, method: 'GET' ,responseType: "blob"});
    const CommitContract = response.data.abi;

    brightContract = new web3.eth.Contract(BrightContract, BRIGHT_CONTRACT_ADDRESS);
    commitContract = new web3.eth.Contract(CommitContract, COMMIT_CONTRACT_ADDRESS);
}

async function start() {
    await init();
    await getUserData();
    await getCommitDetail();
}

async function getUserData() {
    const repRes = await brightContract.methods.getUserSeasonReputation(USER_ADDRESS, 1).call({ from: USER_ADDRESS });
    console.log(`[${new Date().toISOString()}] User reputation result:`, repRes);
}

async function getCommitDetail() {
    const seasonData = await brightContract.methods.getCurrentSeason().call({ from: USER_ADDRESS });
    const userCommits = await brightContract.methods.getUserSeasonCommits(USER_ADDRESS, seasonData[0], 0, COMMITS_BLOCK_SIZE).call({ from: USER_ADDRESS });;
    const totalReviews = userCommits[1].length;
    const randomNumber = Math.floor(Math.random() * (totalReviews - 0)) + 0;
    const url = userCommits[1][randomNumber];
    const commitDetails = await commitContract.methods.getDetailsCommits(url).call({ from: USER_ADDRESS});
    console.log(`[${new Date().toISOString()}] Commit details result:`, commitDetails);
    const reviewDetails = await commitContract.methods.getCommentDetail(url, USER_ADDRESS).call({ from: USER_ADDRESS});
    console.log(`[${new Date().toISOString()}] Review details result:`, reviewDetails);
}

start();