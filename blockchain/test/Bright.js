const Bright = artifacts.require("./Bright.sol");
const Commits = artifacts.require("./Commits.sol");
const Root = artifacts.require("./Root.sol");
const CloudTeamManager = artifacts.require("./CloudTeamManager.sol");
const Web3 = require("web3");
const truffleAssert = require("truffle-assertions");

const NODE_URL = "http://127.0.0.1:7545";
const NUMBER_OF_USERS = 2;
const NUMBER_OF_REVIEWERS = 1;
const NUMBER_OF_REVIEWS = 1;
const NUMBER_OF_COMMITS = 1;
var TEAM_NAME = "TEAM 1";
var USER_ONE = "Manuel";
var EMAIL_USER_ONE = "manuel@example.com";
var USER_TWO = "Marcos";
var EMAIL_USER_TWO = "marcos@example.com";
const COMMIT_TITTLE = "Example Commit";
const COMMIT_URL = "https://bitbucket.org/exampleWorkspace/exampleRepo/commits/ffffffffffffffffffffsdsdfgfdsgsdfgsdffff";
const REVIEW_COMMENT = "Well done";
const REVIEW_POINTS = [5, 3, 3];
const COMMENT_VOTE = 2;
const LONG_EXP_SECS = 2000;
const MEMBER_USERTYPE = 2;

const DAY_TO_SECS = 24 * 60 * 60;
const INITIAL_SEASON_LENGTH_DAYS = 15;
const INITIAL_SEASON_DAY_LENGTH_SECS = INITIAL_SEASON_LENGTH_DAYS * DAY_TO_SECS;
const NEW_SEASON_LENGTH_DAYS = 24;
const INVALID_SEASON_LENGTH_DAYS = 365 * 11;

contract("Bright", accounts => {
    let cloudTeamManager;
    let adminUserAddress = accounts[8];
    let invalidUser = accounts[7];
    let accountOne = accounts[6];
    let accountTwo = accounts[5];
    let brightInstance;
    let brightAddress;
    let commitInstance;
    let commitAddress;
    let rootInstance;
    let rootAddress;
    let teamUid;

    it("Creating the enviroment" ,async () => {
        transformVariables();
        cloudTeamManager = await CloudTeamManager.deployed();
        teamUid = await createTeamAndDeployContracts(cloudTeamManager, EMAIL_USER_ONE, TEAM_NAME, INITIAL_SEASON_LENGTH_DAYS, adminUserAddress);
        let contractsAddresses = await cloudTeamManager.getTeamContractAddresses(teamUid, { from: adminUserAddress });
        brightAddress = contractsAddresses[0];
        brightInstance = await Bright.at(brightAddress);
        commitAddress = contractsAddresses[1];
        commitInstance = await Commits.at(commitAddress);
        rootAddress = contractsAddresses[3];
        rootInstance = await Root.at(rootAddress);
    });

    it("Should change season length", async () => {
        let currentSeason = await brightInstance.getCurrentSeason({ from: adminUserAddress });
        parseBnAndAssertEqual(parseBnToInt(currentSeason[2]), INITIAL_SEASON_DAY_LENGTH_SECS, "The initial season length is not correct");

        await rootInstance.setSeasonLength(NEW_SEASON_LENGTH_DAYS, { from: adminUserAddress });
        currentSeason = await brightInstance.getCurrentSeason({ from: adminUserAddress });
        parseBnAndAssertEqual(parseBnToInt(currentSeason[2]), NEW_SEASON_LENGTH_DAYS * DAY_TO_SECS, "The season length change was not done correctly");
    });

    it("Should give error changing the season length with an invalid address", async () => {
        await truffleAssert.reverts(
            rootInstance.setSeasonLength(NEW_SEASON_LENGTH_DAYS, { from: invalidUser }),
            "The origin address is not allowed"
        );
    });

    it("Should give error changing the season length with an invalid length", async () => {
        await truffleAssert.reverts(
            rootInstance.setSeasonLength(INVALID_SEASON_LENGTH_DAYS, { from: adminUserAddress }),
            "Invalid season length"
        );
    });

    it("Should Create two users", async () => {
        await inviteUser(cloudTeamManager, teamUid, EMAIL_USER_TWO, accountTwo, MEMBER_USERTYPE, LONG_EXP_SECS, adminUserAddress);
        await brightInstance.setProfile(USER_ONE, EMAIL_USER_ONE, { from: accountOne });
        await brightInstance.setProfile(USER_TWO, EMAIL_USER_TWO, { from: accountTwo });
        let usersAddress = await brightInstance.getUsersAddress({ from: adminUserAddress });
        assert(usersAddress.indexOf(accountOne) !== -1, "The user one is not registered");
        assert(usersAddress.indexOf(accountTwo) !== -1, "The user two is not registered");
        assert.equal(usersAddress.length, NUMBER_OF_USERS);

        let userDetails = await brightInstance.getUser(accountOne,  { from: accountOne });
        assert.equal(userDetails[0], USER_ONE);
        assert.equal(userDetails[1], EMAIL_USER_ONE);
    });

    it("Should give error creating an already created account", async () => {
        await truffleAssert.reverts(
            brightInstance.setProfile(USER_ONE, EMAIL_USER_ONE, { from: accountOne }),
            "User already exists"
        );
    });

    it("Should Create and remove a new commit with one reviewer", async () => {
        const web3 = openConnection();
        let commitUrl = web3.utils.keccak256(COMMIT_URL)

        await createNewCommit(brightInstance, commitInstance, rootInstance, accountOne, accountTwo);

        await brightInstance.removeUserCommit(commitUrl, { from: accountOne });

        user1 = await brightInstance.getUser(accountOne, { from: accountOne });
        parseBnAndAssertEqual(user1[3], 0);

        userState = await brightInstance.getUserSeasonState(accountTwo, 1, { from: accountTwo });
        parseBnAndAssertEqual(userState[0], 0);
    });

    it("Should Create a new commit with one reviewer", async () => {
        await createNewCommit(brightInstance, commitInstance, rootInstance, accountOne, accountTwo);
    });

    it("Should review one commit", async () => {
        let userState = await brightInstance.getUserSeasonState(accountTwo, 1, { from: accountTwo });
        parseBnAndAssertEqual(userState[0], NUMBER_OF_REVIEWS);
        parseBnAndAssertEqual(userState[1], 0);

        await commitInstance.setReview(COMMIT_URL, REVIEW_COMMENT, REVIEW_POINTS, { from: accountTwo })

        userState = await brightInstance.getUserSeasonState(accountTwo, 1, { from: accountTwo });
        parseBnAndAssertEqual(userState[0], 0);
        parseBnAndAssertEqual(userState[1], NUMBER_OF_REVIEWS);
    });

    it("Should set feedback of commit", async () => {
        const web3 = openConnection();
        let commitUrl = web3.utils.keccak256(COMMIT_URL)

        let comments = await commitInstance.getCommentsOfCommit(commitUrl, { from: accountOne });
        let commentDetails = await commitInstance.getCommentDetail(commitUrl, comments[1][0], { from: accountOne });
        parseBnAndAssertEqual(commentDetails[1], 0);
        
        await rootInstance.setVote(COMMIT_URL, accountTwo, COMMENT_VOTE, { from: accountOne });

        commentDetails = await commitInstance.getCommentDetail(commitUrl, comments[1][0], { from: accountOne });
        parseBnAndAssertEqual(commentDetails[1], COMMENT_VOTE);

    });

});

async function createTeamAndDeployContracts(cloudTeamManager, userMail, teamName, seasonLength, adminUserAddress) {
    await cloudTeamManager.createTeam(userMail, teamName, { from: adminUserAddress });
    let response = await cloudTeamManager.getUserTeam(userMail);
    let teamUid = parseBnToInt(response[response.length-1]);
    await cloudTeamManager.deployBright(teamUid, { from: adminUserAddress });
    await cloudTeamManager.deployCommits(teamUid, { from: adminUserAddress });
    await cloudTeamManager.deployThreshold(teamUid, { from: adminUserAddress });
    await cloudTeamManager.deployRoot(userMail, teamUid, seasonLength, { from: adminUserAddress });
    return teamUid;
}

async function createNewCommit(brightInstance, commitInstance, rootInstance, committerAddr, reviewerAddr) {
    const web3 = openConnection();

    await commitInstance.setNewCommit(COMMIT_TITTLE, COMMIT_URL, NUMBER_OF_REVIEWERS, { from: committerAddr });
    let user1 = await brightInstance.getUser(committerAddr, { from: committerAddr });

    parseBnAndAssertEqual(user1[3], NUMBER_OF_COMMITS);

    let userState = await brightInstance.getUserSeasonState(reviewerAddr, 1, { from: reviewerAddr });
    parseBnAndAssertEqual(userState[0], 0);

    let reviewers = new Array();
    reviewers.push(EMAIL_USER_TWO);
    await rootInstance.notifyCommit(COMMIT_URL, reviewers, { from: committerAddr });
    userState = await brightInstance.getUserSeasonState(reviewerAddr, 1, { from: reviewerAddr });
    parseBnAndAssertEqual(userState[0], NUMBER_OF_REVIEWS);
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
    return parseInt(new BN(bigNumber));
}

function openConnection() {
    return new Web3(new Web3.providers.HttpProvider(NODE_URL));
}

async function inviteUser(teamManagerInstance, team1Uid, email, invitedAddress, usertype, expiration, senderAddress) {
    let response = await teamManagerInstance.inviteToTeam(team1Uid, email, usertype, expiration, { from: senderAddress });       
    assert(response.receipt.status);
    let isUserInvited = await teamManagerInstance.isUserEmailInvitedToTeam(email, team1Uid);
    assert(isUserInvited, "User is not invited to team");
    let invitedUserInfo = await teamManagerInstance.getInvitedUserInfo(email, team1Uid);
    assert(invitedUserInfo[2] == usertype, "User invitation is not member");
    await registerToTeam(teamManagerInstance, invitedAddress, email, team1Uid, 0, false);
}

async function registerToTeam(teamManagerInstance, userAddress, email, team1Uid, empyTeamId, shouldFail) {
    let response = await teamManagerInstance.registerToTeam(userAddress, email, team1Uid, { from: userAddress })
    assert(response.receipt.status);
    let teamUids =  await teamManagerInstance.getUserTeam(email);
    assert(shouldFail ? teamUids.length === empyTeamId : teamUids.length !== empyTeamId, "Team was created incorrectly");
    return team1Uid;
}

async function transformVariables() {
    const web3 = openConnection();
    TEAM_NAME = web3.utils.keccak256(TEAM_NAME);
    USER_ONE = web3.utils.keccak256(USER_ONE);
    EMAIL_USER_ONE = web3.utils.keccak256(EMAIL_USER_ONE);
    USER_TWO = web3.utils.keccak256(USER_TWO);
    EMAIL_USER_TWO = web3.utils.keccak256(EMAIL_USER_TWO);
}