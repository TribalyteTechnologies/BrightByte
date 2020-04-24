const Bright = artifacts.require("./Bright.sol");
const Commits = artifacts.require("./Commits.sol");
const Root = artifacts.require("./Root.sol");
const CloudBBFactory = artifacts.require("./CloudBrightByteFactory.sol");
const CloudEventDispatcher = artifacts.require("./CloudEventDispatcher.sol");
const truffleAssert = require("truffle-assertions");
const Web3 = require("web3");

require("truffle-test-utils").init();

const NODE_URL = "http://127.0.0.1:7545";
const TEAM_UID = 1;
const NUMBER_OF_USERS = 2;
const NUMBER_OF_REVIEWERS = 1;
const NUMBER_OF_COMMITS = 1;
const USER_ONE = "Manuel";
const EMAIL_USER_ONE = "manuel@example.com";
const USER_TWO = "Marcos";
const EMAIL_USER_TWO = "marcos@example.com";
const COMMIT_TITTLE = "Example Commit";
const COMMIT_URL = "https://bitbucket.org/tribalyte/exampleRepo/commits/ffffffffffffffffffffsdsdfgfdsgsdfgsdffff";


contract("EventDispatcher", accounts => {
    let cloudBBFactory;
    let cloudEventDispatcher;
    let cloudEventDispatcherAddress;
    let accountOne = accounts[8];
    let accountTwo = accounts[7];
    let owner = accounts[0];
    let brightInstance;
    let brightAddress;
    let commitInstance;
    let commitAddress;
    let rootInstance;
    let rootAddress;

    it("Creating the enviroment" ,async () => {
        cloudBBFactory = await CloudBBFactory.deployed();
        let response = await deployBrightCommitsThreshold(cloudBBFactory, TEAM_UID);
        cloudEventDispatcherAddress = await cloudBBFactory.getEventDispatcherAddress();
        cloudEventDispatcher = await CloudEventDispatcher.at(cloudEventDispatcherAddress);
        assert(response.receipt.status, "Contract deployed incorrectly");
        response = await cloudBBFactory.deployRoot(TEAM_UID, accountOne);
        assert(response.receipt.status, "Contract deployed incorrectly");
        let contractsAddresses = await cloudBBFactory.getTeamContractAddresses(TEAM_UID);
        brightAddress = contractsAddresses[0];
        brightInstance = await Bright.at(brightAddress);
        commitAddress = contractsAddresses[1];
        commitInstance = await Commits.at(commitAddress);
        rootAddress = contractsAddresses[3];
        rootInstance = await Root.at(rootAddress);
    });

    it("Should Create two users", async () => {
        let tx1 = await brightInstance.setProfile(USER_ONE, EMAIL_USER_ONE, { from: accountOne });
        let tx2 = await brightInstance.setProfile(USER_TWO, EMAIL_USER_TWO, { from: accountTwo });
        let usersAddress = await brightInstance.getUsersAddress();
        assert(usersAddress.indexOf(accountOne) !== -1, "The user one is not registered");
        assert(usersAddress.indexOf(accountTwo) !== -1, "The user two is not registered");
        assert.equal(usersAddress.length, NUMBER_OF_USERS);
    });

    it("Should Create a new commit with one reviewer", async () => {
        const web3 = openConnection();

        let tx1 = await commitInstance.setNewCommit(COMMIT_TITTLE, COMMIT_URL, NUMBER_OF_REVIEWERS, { from: accountOne });
        let user1 = await brightInstance.getUser(accountOne);

        var BN = web3.utils.BN;
        const userCommits  = new BN(user1[3]).toString();
        assert.equal(userCommits, NUMBER_OF_COMMITS);

        let reviewers = new Array();
        reviewers.push(web3.utils.keccak256(EMAIL_USER_TWO));
    });

    it("Check the event emmited for the new Users", async () => {
        const eventResults = await instanceContractEvent(cloudEventDispatcher, "NewUserEvent");
        assert.equal(eventResults.length, NUMBER_OF_USERS);
    });

    it("Check the event emmited for the new commit", async () => {
        const eventResults = await instanceContractEvent(cloudEventDispatcher, "UserNewCommit");
        assert.equal(eventResults.length, NUMBER_OF_COMMITS);
    });

});

function deployBrightCommitsThreshold(cloudBBFactory, teamUId) {
    return cloudBBFactory.deployBright(teamUId)
        .then(response => {
            assert(response.receipt.status, "Contract deployed incorrectly");
            return cloudBBFactory.deployCommits(teamUId);
        }).then(response => {
            assert(response.receipt.status, "Contract deployed incorrectly");
            return cloudBBFactory.deployThreshold(teamUId);  
        });
}

function openConnection() {
    return new Web3(new Web3.providers.HttpProvider(NODE_URL));
}

async function instanceContractEvent(cloudEventDispatcher, eventType) {
    const web3 = openConnection();
    const contract = new web3.eth.Contract(cloudEventDispatcher.abi, cloudEventDispatcher.address);
    const eventsResult = await contract.getPastEvents(eventType, {fromBlock: 0, toBlock: "latest"});
    return eventsResult;
}