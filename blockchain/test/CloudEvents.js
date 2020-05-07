const Bright = artifacts.require("./Bright.sol");
const Commits = artifacts.require("./Commits.sol");
const Root = artifacts.require("./Root.sol");
const CloudBBFactory = artifacts.require("./CloudBrightByteFactory.sol");
const CloudEventDispatcher = artifacts.require("./CloudEventDispatcher.sol");
const CloudTeamManager = artifacts.require("./CloudTeamManager.sol");
const truffleAssert = require("truffle-assertions");
const Web3 = require("web3");

require("truffle-test-utils").init();

const NODE_URL = "http://127.0.0.1:7545";
const INITIAL_SEASON_INDEX = 1;
const NUMBER_OF_USERS = 2;
const NUMBER_OF_REVIEWERS = 1;
const NUMBER_OF_COMMITS = 1;
const NUMBER_OF_REVIEWS = 1;
const DELETED_COMMITS = 1;
const USER_ONE = "Manuel";
const EMAIL_USER_ONE = "manuel@example.com";
const USER_TWO = "Marcos";
const EMAIL_USER_TWO = "marcos@example.com";
const COMMIT_TITTLE = "Example Commit";
const COMMIT_URL = "https://bitbucket.org/tribalyte/exampleRepo/commits/ffffffffffffffffffff";
const REVIEW_TEXT = "Example Review";
const REVIEW_POINTS =  [500, 200, 100];
const INITIAL_SEASON_LENGTH = 15;
const TEAM_NAME = "TEAM 1";
const MEMBER_USERTYPE = 2;
const ADMIN_USERTYPE = 1;
const LONG_EXP_SECS = 2000;


contract("EventDispatcher", accounts => {
    let cloudBBFactory;
    let cloudTeamManager;
    let cloudEventDispatcher;
    let cloudEventDispatcherAddress;
    let adminUserAddress = accounts[8];
    let accountOne = accounts[7];
    let accountTwo = accounts[6];
    let brightInstance;
    let brightAddress;
    let commitInstance;
    let commitAddress;
    let rootInstance;
    let rootAddress;
    let teamUid;

    it("Creating the enviroment" ,async () => {
        cloudBBFactory = await CloudBBFactory.deployed();
        cloudTeamManager = await CloudTeamManager.deployed();
        teamUid = await createTeamAndDeployContracts(cloudTeamManager, EMAIL_USER_ONE, TEAM_NAME, INITIAL_SEASON_LENGTH, adminUserAddress);
        let contractsAddresses = await cloudTeamManager.getTeamContractAddresses(teamUid, { from: adminUserAddress });
        cloudEventDispatcherAddress = await cloudBBFactory.getEventDispatcherAddress();
        cloudEventDispatcher = await CloudEventDispatcher.at(cloudEventDispatcherAddress);
        brightAddress = contractsAddresses[0];
        brightInstance = await Bright.at(brightAddress);
        commitAddress = contractsAddresses[1];
        commitInstance = await Commits.at(commitAddress);
        rootAddress = contractsAddresses[3];
        rootInstance = await Root.at(rootAddress);
    });

    it("Should Create two users", async () => {
        inviteUser(cloudTeamManager, teamUid, EMAIL_USER_ONE, ADMIN_USERTYPE, LONG_EXP_SECS, adminUserAddress);
        inviteUser(cloudTeamManager, teamUid, EMAIL_USER_TWO, MEMBER_USERTYPE, LONG_EXP_SECS, adminUserAddress);
        let tx1 = await brightInstance.setProfile(USER_ONE, EMAIL_USER_ONE, { from: accountOne });
        let tx2 = await brightInstance.setProfile(USER_TWO, EMAIL_USER_TWO, { from: accountTwo });
    });

    it("Should Create a new commit with one reviewer", async () => {
        const web3 = openConnection();

        let tx1 = await commitInstance.setNewCommit(COMMIT_TITTLE, COMMIT_URL, NUMBER_OF_REVIEWERS, { from: accountOne });
        let user1 = await brightInstance.getUser(accountOne, { from: accountOne });
        parseBnAndAssertEqual(user1[3], NUMBER_OF_COMMITS);

        let userState = await brightInstance.getUserSeasonState(accountTwo, INITIAL_SEASON_INDEX, { from: accountTwo });
        parseBnAndAssertEqual(userState[0], 0);

        let reviewers = new Array();
        reviewers.push(web3.utils.keccak256(EMAIL_USER_TWO));
        let tx2 = await rootInstance.notifyCommit(COMMIT_URL, reviewers, { from: accountOne });
        let reviewerState = await brightInstance.getUserSeasonState(accountTwo, INITIAL_SEASON_INDEX, { from: accountTwo });
        parseBnAndAssertEqual(reviewerState[0], NUMBER_OF_COMMITS);
    });

    it("Should Create a new review", async () => {
        let reviewerState = await brightInstance.getUser(accountTwo, { from: accountTwo });
        parseBnAndAssertEqual(reviewerState[2], 0);
        let tx1 = commitInstance.setReview(COMMIT_URL, REVIEW_TEXT, REVIEW_POINTS, { from: accountTwo });
        const web3 = openConnection();
        reviewerState = await brightInstance.getUser(accountTwo, { from: accountTwo });
        parseBnAndAssertEqual(reviewerState[2], NUMBER_OF_REVIEWS);
    });

    it("Check the event emmited for the new Users", async () => {
        const eventResults = await instanceContractEvent(cloudEventDispatcher, "NewUserEvent");
        assert.equal(eventResults.length, NUMBER_OF_USERS);
    });

    it("Check the event emmited for the new commit", async () => {
        const eventResults = await instanceContractEvent(cloudEventDispatcher, "UserNewCommit");
        assert.equal(eventResults.length, NUMBER_OF_COMMITS);
    });

    it("Check the event emmited for the new review", async () => {
        const eventResults = await instanceContractEvent(cloudEventDispatcher, "UserNewReview");
        assert.equal(eventResults.length, NUMBER_OF_REVIEWS);
    });

    it("Should Create a new commit and then delete it", async () => {
        const urlCommit = COMMIT_URL + "delete";
        const web3 = openConnection();
        let user1 = await brightInstance.getUser(accountOne, { from: accountOne });
        const initialNumberOfCommits = parseBnToInt(user1[3]);
        const tx1 = await commitInstance.setNewCommit(COMMIT_TITTLE, urlCommit, NUMBER_OF_REVIEWERS, { from: accountOne });
        user1 = await brightInstance.getUser(accountOne, { from: accountOne });
        parseBnAndAssertEqual(user1[3], initialNumberOfCommits + 1);

        let reviewers = new Array();
        reviewers.push(web3.utils.keccak256(EMAIL_USER_TWO));
        const tx2 = await rootInstance.notifyCommit(COMMIT_URL, reviewers, { from: accountOne });
        let reviewerState = await brightInstance.getUserSeasonState(accountTwo, INITIAL_SEASON_INDEX, { from: accountTwo });
        parseBnAndAssertEqual(reviewerState[0], 1);

        const urlKeccak = web3.utils.keccak256(urlCommit);
        const tx3 = await brightInstance.removeUserCommit(urlKeccak, { from: accountOne });

        user1 = await brightInstance.getUser(accountOne, { from: accountOne });
        parseBnAndAssertEqual(user1[3], initialNumberOfCommits);
    });

    it("Check the event emmited for the new review", async () => {
        const eventResults = await instanceContractEvent(cloudEventDispatcher, "DeletedCommit");
        assert.equal(eventResults.length, DELETED_COMMITS);
    });
});

async function createTeamAndDeployContracts(cloudTeamManager, userMail, teamName, seasonLength, adminUserAddress) {
    let tx = await cloudTeamManager.createTeam(userMail, teamName, { from: adminUserAddress });
    let response = await cloudTeamManager.getUserTeam(adminUserAddress);
    let teamUid = parseBnToInt(response);
    tx = await cloudTeamManager.deployBright(teamUid, { from: adminUserAddress });
    tx = await cloudTeamManager.deployCommits(teamUid, { from: adminUserAddress });
    tx = await cloudTeamManager.deployThreshold(teamUid, { from: adminUserAddress });
    tx = await cloudTeamManager.deployRoot(teamUid, seasonLength, { from: adminUserAddress });
    return teamUid;
}

function openConnection() {
    return new Web3(new Web3.providers.HttpProvider(NODE_URL));
}

function parseBnAndAssertEqual(bigNumber, equalValue, assertMsg) {
    let integer = parseBnToInt(bigNumber);
    if (assertMsg){
        assert.equal(integer, equalValue, assertMsg);
    }else{
        assert.equal(integer, equalValue);
    }
}

function parseBnToInt(bigNumber) {
    const web3 = openConnection();
    var BN = web3.utils.BN;
    let integer = parseInt(new BN(bigNumber));
    return integer;
}

async function instanceContractEvent(cloudEventDispatcher, eventType) {
    const web3 = openConnection();
    const contract = new web3.eth.Contract(cloudEventDispatcher.abi, cloudEventDispatcher.address);
    const eventsResult = await contract.getPastEvents(eventType, {fromBlock: 0, toBlock: "latest"});
    return eventsResult;
}

async function inviteUser(teamManagerInstance, team1Uid, email, usertype, expiration, senderAddress) {
    let response = await teamManagerInstance.inviteToTeam(team1Uid, email, usertype, expiration, { from: senderAddress });       
    assert(response.receipt.status);
    let isUserInvited = await teamManagerInstance.isUserEmailInvitedToTeam(email, team1Uid);
    assert(isUserInvited, "User is not invited to team");
    let invitedUserInfo = await teamManagerInstance.getInvitedUserInfo(email, team1Uid);
    assert(invitedUserInfo[2] == usertype, "User invitation is not member");
}
