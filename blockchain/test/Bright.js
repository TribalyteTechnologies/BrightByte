const Bright = artifacts.require("./Bright.sol");
const Commits = artifacts.require("./Commits.sol");
const Root = artifacts.require("./Root.sol");
const CloudBBFactory = artifacts.require("./CloudBrightByteFactory.sol");
const CloudEventDispatcher = artifacts.require("./CloudEventDispatcher.sol");
const Web3 = require("web3");
const truffleAssert = require('truffle-assertions');

const NODE_URL = "http://127.0.0.1:7545";
const NUMBER_OF_USERS = 2;
const NUMBER_OF_REVIEWERS = 1;
const NUMBER_OF_REVIEWS = 1;
const NUMBER_OF_COMMITS = 1;
const USER_ONE = "Manuel";
const EMAIL_USER_ONE = "manuel@example.com";
const USER_TWO = "Marcos";
const EMAIL_USER_TWO = "marcos@example.com";
const COMMIT_TITTLE = "Example Commit";
const COMMIT_URL = "https://bitbucket.org/exampleWorkspace/exampleRepo/commits/ffffffffffffffffffffsdsdfgfdsgsdfgsdffff";
const REVIEW_COMMENT = "Well done";
const REVIEW_POINTS = [5, 3, 3];
const COMMENT_VOTE = 2;


const TEAM_UID = 1;
const DAY_TO_SECS = 24 * 60 * 60;
const INITIAL_SEASON_LENGTH = 15;
const INITIAL_SEASON_DAY_LENGTH_SECS = INITIAL_SEASON_LENGTH * DAY_TO_SECS;
const NEW_SEASON_LENGTH = 24;


contract("Bright", accounts => {
    let cloudBBFactory;
    let cloudEventDispatcher;
    let cloudEventDispatcherAddress;
    let adminUser = accounts[8];
    let invalidUser = accounts[7];
    let accountOne = accounts[6];
    let accountTwo = accounts[5];
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
        response = await cloudBBFactory.deployRoot(TEAM_UID, adminUser, INITIAL_SEASON_LENGTH);
        assert(response.receipt.status, "Contract deployed incorrectly");
        let contractsAddresses = await cloudBBFactory.getTeamContractAddresses(TEAM_UID);
        brightAddress = contractsAddresses[0];
        brightInstance = await Bright.at(brightAddress);
        commitAddress = contractsAddresses[1];
        commitInstance = await Commits.at(commitAddress);
        rootAddress = contractsAddresses[3];
        rootInstance = await Root.at(rootAddress);
    });

    it("Should change season length", async () => {
        const web3 = openConnection();
        let currentSeason = await brightInstance.getCurrentSeason();
        parseBnAndAssertEqual(currentSeason[2], INITIAL_SEASON_DAY_LENGTH_SECS, "The initial season length is not correct");

        let tx = await rootInstance.setSeasonLength(NEW_SEASON_LENGTH, { from: adminUser });
        currentSeason = await brightInstance.getCurrentSeason();
        parseBnAndAssertEqual(currentSeason[2], NEW_SEASON_LENGTH * DAY_TO_SECS, "The season length change was not done correctly");
    });

    it("should give error changing the season length with an invalid address", async () => {
        await truffleAssert.reverts(
            rootInstance.setSeasonLength(NEW_SEASON_LENGTH, { from: invalidUser }),
            "The origin address is not allowed"
        );
    });

    it("Should Create two users", async () => {
        let tx1 = await brightInstance.setProfile(USER_ONE, EMAIL_USER_ONE, { from: accountOne });
        let tx2 = await brightInstance.setProfile(USER_TWO, EMAIL_USER_TWO, { from: accountTwo });
        let usersAddress = await brightInstance.getUsersAddress();
        assert(usersAddress.indexOf(accountOne) !== -1, "The user one is not registered");
        assert(usersAddress.indexOf(accountTwo) !== -1, "The user two is not registered");
        assert.equal(usersAddress.length, NUMBER_OF_USERS);
    });

    it("Should Create and remove a new commit with one reviewer", async () => {
        const web3 = openConnection();
        let commitUrl = web3.utils.keccak256(COMMIT_URL)

        await createNewCommit(brightInstance, commitInstance, rootInstance, accountOne, accountTwo);

        let tx3 = await brightInstance.removeUserCommit(commitUrl, { from: accountOne });

        user1 = await brightInstance.getUser(accountOne);
        parseBnAndAssertEqual(user1[3], 0);

        userState = await brightInstance.getUserSeasonState(accountTwo, 1);
        parseBnAndAssertEqual(userState[0], 0);
    });

    it("Should Create a new commit with one reviewer", async () => {
        await createNewCommit(brightInstance, commitInstance, rootInstance, accountOne, accountTwo);
    });

    it("Should review one commit", async () => {
        const web3 = openConnection();

        let userState = await brightInstance.getUserSeasonState(accountTwo, 1);
        parseBnAndAssertEqual(userState[0], NUMBER_OF_REVIEWS);
        parseBnAndAssertEqual(userState[1], 0);

        let tx1 = await commitInstance.setReview(COMMIT_URL, REVIEW_COMMENT, REVIEW_POINTS, { from: accountTwo })

        userState = await brightInstance.getUserSeasonState(accountTwo, 1);
        parseBnAndAssertEqual(userState[0], 0);
        parseBnAndAssertEqual(userState[1], NUMBER_OF_REVIEWS);
    });

    it("Should set feedback of commit", async () => {
        const web3 = openConnection();
        let commitUrl = web3.utils.keccak256(COMMIT_URL)

        let comments = await commitInstance.getCommentsOfCommit(commitUrl);
        let commentDetails = await commitInstance.getCommentDetail(commitUrl, comments[1][0]);
        parseBnAndAssertEqual(commentDetails[1], 0);
        
        let tx1 = await rootInstance.setVote(COMMIT_URL, accountTwo, COMMENT_VOTE, { from: accountOne });

        commentDetails = await commitInstance.getCommentDetail(commitUrl, comments[1][0]);
        parseBnAndAssertEqual(commentDetails[1], COMMENT_VOTE);

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

async function createNewCommit(brightInstance, commitInstance, rootInstance, committerAddr, reviewerAddr) {
    const web3 = openConnection();

    let tx1 = await commitInstance.setNewCommit(COMMIT_TITTLE, COMMIT_URL, NUMBER_OF_REVIEWERS, { from: committerAddr });
    let user1 = await brightInstance.getUser(committerAddr);

    parseBnAndAssertEqual(user1[3], NUMBER_OF_COMMITS);

    let userState = await brightInstance.getUserSeasonState(reviewerAddr, 1);
    parseBnAndAssertEqual(userState[0], 0);

    let reviewers = new Array();
    reviewers.push(web3.utils.keccak256(EMAIL_USER_TWO));
    let tx2 = await rootInstance.notifyCommit(COMMIT_URL, reviewers, { from: committerAddr });
    userState = await brightInstance.getUserSeasonState(reviewerAddr, 1);
    parseBnAndAssertEqual(userState[0], NUMBER_OF_REVIEWS);
}

function parseBnAndAssertEqual(bigNumber, equalValue, assertMsg) {
    const web3 = openConnection();
    var BN = web3.utils.BN;
    let integer = parseInt(new BN(bigNumber));
    if (assertMsg){
        assert.equal(integer, equalValue, assertMsg);
    }else{
        assert.equal(integer, equalValue);
    }
}

function openConnection() {
    return new Web3(new Web3.providers.HttpProvider(NODE_URL));
}
