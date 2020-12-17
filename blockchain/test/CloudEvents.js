const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const Bright = artifacts.require("./Bright.sol");
const Commits = artifacts.require("./Commits.sol");
const Root = artifacts.require("./Root.sol");
const CloudBBFactory = artifacts.require("./CloudBrightByteFactory.sol");
const CloudEventDispatcher = artifacts.require("./CloudEventDispatcher.sol");
const CloudTeamManager = artifacts.require("./CloudTeamManager.sol");

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
const INITIAL_SEASON_LENGTH_DAYS = 15;
const TEAM_NAME = "TEAM 1";
const MEMBER_USERTYPE = 2;
const LONG_EXP_SECS = 2000;

var teamNameHash;
var userOneHash;
var emailUserOneHash;
var userTwoHash;
var emailUserTwoHash;

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
        transformVariables();
        cloudBBFactory = await CloudBBFactory.deployed();
        cloudTeamManager = await CloudTeamManager.deployed();
        teamUid = await createTeamAndDeployContracts(cloudTeamManager, emailUserOneHash, teamNameHash, INITIAL_SEASON_LENGTH_DAYS, adminUserAddress);
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
        await inviteUser(cloudTeamManager, teamUid, emailUserTwoHash, accountTwo, MEMBER_USERTYPE, LONG_EXP_SECS, adminUserAddress);
        await brightInstance.setProfile(userOneHash, emailUserOneHash, { from: accountOne });
        await brightInstance.setProfile(userTwoHash, emailUserTwoHash, { from: accountTwo });
    });

    it("Should Create a new commit with one reviewer", async () => {

        await commitInstance.setNewCommit(COMMIT_TITTLE, COMMIT_URL, NUMBER_OF_REVIEWERS, { from: accountOne });
        let user1 = await brightInstance.getUser(accountOne, { from: accountOne });
        assert.equal(parseBnToInt(user1[3]), NUMBER_OF_COMMITS);

        let userState = await brightInstance.getUserSeasonState(accountTwo, INITIAL_SEASON_INDEX, { from: accountTwo });
        assert.equal(parseBnToInt(userState[0]), 0);

        let reviewers = new Array();
        reviewers.push(emailUserTwoHash);
        await rootInstance.notifyCommit(COMMIT_URL, reviewers, { from: accountOne });
        let reviewerState = await brightInstance.getUserSeasonState(accountTwo, INITIAL_SEASON_INDEX, { from: accountTwo });
        assert.equal(parseBnToInt(reviewerState[0]), NUMBER_OF_COMMITS);
    });

    it("Should Create a new review", async () => {
        let reviewerState = await brightInstance.getUser(accountTwo, { from: accountTwo });
        assert.equal(parseBnToInt(reviewerState[2]), 0);
        commitInstance.setReview(COMMIT_URL, REVIEW_TEXT, REVIEW_POINTS, { from: accountTwo });
        reviewerState = await brightInstance.getUser(accountTwo, { from: accountTwo });
        assert.equal(parseBnToInt(reviewerState[2]), NUMBER_OF_REVIEWS);
    });

    it("Check the event emmited for the new Users", async () => {
        const eventResults = await instanceContractEvent(cloudEventDispatcher, "NewUserEvent");
        assert.equal(eventResults.length, NUMBER_OF_USERS, "The number of events for new users is incorrect");
    });

    it("Check the event emmited for the new commit", async () => {
        const eventResults = await instanceContractEvent(cloudEventDispatcher, "UserNewCommit");
        assert.equal(eventResults.length, NUMBER_OF_COMMITS, "The number for events for new user commits is incorrect");
    });

    it("Check the event emmited for the new review", async () => {
        const eventResults = await instanceContractEvent(cloudEventDispatcher, "UserNewReview");
        assert.equal(eventResults.length, NUMBER_OF_REVIEWS, "The number for events for new user reviews is incorrect");
    });

    it("Should Create a new commit and then delete it", async () => {
        const urlCommit = COMMIT_URL + "delete";
        let user1 = await brightInstance.getUser(accountOne, { from: accountOne });
        const initialNumberOfCommits = parseBnToInt(user1[3]);
        await commitInstance.setNewCommit(COMMIT_TITTLE, urlCommit, NUMBER_OF_REVIEWERS, { from: accountOne });
        user1 = await brightInstance.getUser(accountOne, { from: accountOne });
        assert.equal(parseBnToInt(user1[3]), initialNumberOfCommits + 1);

        let reviewers = new Array();
        reviewers.push(emailUserTwoHash);
        await rootInstance.notifyCommit(COMMIT_URL, reviewers, { from: accountOne });
        let reviewerState = await brightInstance.getUserSeasonState(accountTwo, INITIAL_SEASON_INDEX, { from: accountTwo });
        assert.equal(parseBnToInt(reviewerState[0]), 1);

        const urlKeccak = web3.utils.keccak256(urlCommit);
        await brightInstance.removeUserCommit(urlKeccak, { from: accountOne });

        user1 = await brightInstance.getUser(accountOne, { from: accountOne });
        assert.equal(parseBnToInt(user1[3]), initialNumberOfCommits);
    });

    it("Check the event emmited for the new review", async () => {
        const eventResults = await instanceContractEvent(cloudEventDispatcher, "DeletedCommit");
        assert.equal(eventResults.length, DELETED_COMMITS, "The number for events for deleted commits is incorrect");
    });
});

async function createTeamAndDeployContracts(cloudTeamManager, userMail, teamName, seasonLength, adminUserAddress) {
    await cloudTeamManager.createTeam(userMail, teamName, { from: adminUserAddress });
    let response = await cloudTeamManager.getUserTeam(adminUserAddress);
    let teamUid = parseBnToInt(response);
    await cloudTeamManager.deployBright(teamUid, { from: adminUserAddress });
    await cloudTeamManager.deployCommits(teamUid, { from: adminUserAddress });
    await cloudTeamManager.deploySettings(teamUid, { from: adminUserAddress });
    await cloudTeamManager.deployRoot(userMail, teamUid, seasonLength, { from: adminUserAddress });
    return teamUid;
}

function parseBnToInt(bigNumber) {
    return parseInt(bigNumber.toString());
}

async function instanceContractEvent(cloudEventDispatcher, eventType) {
    const contract = new web3.eth.Contract(cloudEventDispatcher.abi, cloudEventDispatcher.address);
    const eventsResult = await contract.getPastEvents(eventType, {fromBlock: 0, toBlock: "latest"});
    return eventsResult;
}

async function inviteUser(teamManagerInstance, team1Uid, email, invitedAddress, usertype, expiration, senderAddress) {
    let response = await teamManagerInstance.inviteToTeam(team1Uid, email, usertype, expiration, { from: senderAddress });       
    assert(response.receipt.status);
    let isUserInvited = await teamManagerInstance.isUserEmailInvitedToTeam(email, team1Uid);
    assert(isUserInvited, "User is not invited to team");
    let invitedUserInfo = await teamManagerInstance.getInvitedUserInfo(email, team1Uid);
    assert(parseBnToInt(invitedUserInfo[2]) == usertype, "User invitation is not member");
    await registerToTeam(teamManagerInstance, invitedAddress, email, team1Uid, 0, false);
}

async function registerToTeam(teamManagerInstance, userAddress, email, team1Uid, empyTeamId, shouldFail) {
    let response = await teamManagerInstance.registerToTeam(userAddress, email, team1Uid, { from: userAddress })
    assert(response.receipt.status);
    let teamUids =  await teamManagerInstance.getUserTeam(userAddress);
    assert(shouldFail ? teamUids.length === empyTeamId : teamUids.length !== empyTeamId, "Team was created incorrectly");
    return team1Uid;
}

async function transformVariables() {
    teamNameHash = web3.utils.utf8ToHex(TEAM_NAME);
    userOneHash = web3.utils.utf8ToHex(USER_ONE);
    emailUserOneHash = web3.utils.utf8ToHex(EMAIL_USER_ONE);
    userTwoHash = web3.utils.utf8ToHex(USER_TWO);
    emailUserTwoHash = web3.utils.utf8ToHex(EMAIL_USER_TWO);
}