const Bright = artifacts.require("./Bright.sol");
const Root = artifacts.require("./Root.sol");
const CloudBBFactory = artifacts.require("./CloudBrightByteFactory.sol");
const CloudEventDispatcher = artifacts.require("./CloudEventDispatcher.sol");
const Web3 = require("web3");
const truffleAssert = require('truffle-assertions');

const NODE_URL = "http://127.0.0.1:7545";


const TEAM_UID = 1;
const DAY_TO_SECS = 24 * 60 * 60;
const INITIAL_SEASON_DAY_LENGTH_SECS = 14 * DAY_TO_SECS;
const NEW_SEASON_LENGTH = 24;

contract("Bright", accounts => {
    let cloudBBFactory;
    let cloudEventDispatcher;
    let cloudEventDispatcherAddress;
    let adminUser = accounts[8];
    let invalidUser = accounts[7];
    let brightInstance;
    let brightAddress;
    let rootInstance;
    let rootAddress;

    it("Creating the enviroment" ,async () => {
        cloudBBFactory = await CloudBBFactory.deployed();
        let response = await deployBrightCommitsThreshold(cloudBBFactory, TEAM_UID);
        cloudEventDispatcherAddress = await cloudBBFactory.getEventDispatcherAddress();
        cloudEventDispatcher = await CloudEventDispatcher.at(cloudEventDispatcherAddress);
        assert(response.receipt.status, "Contract deployed incorrectly");
        response = await cloudBBFactory.deployRoot(TEAM_UID, adminUser);
        assert(response.receipt.status, "Contract deployed incorrectly");
        let contractsAddresses = await cloudBBFactory.getTeamContractAddresses(TEAM_UID);
        brightAddress = contractsAddresses[0];
        brightInstance = await Bright.at(brightAddress);
        rootAddress = contractsAddresses[3];
        rootInstance = await Root.at(rootAddress);
    });

    it("Should change season length", async () => {
        const web3 = openConnection();
        var BN = web3.utils.BN;
        let currentSeason = await brightInstance.getCurrentSeason();
        let seasonLengthSecs = BN(currentSeason[2]).toString();
        assert.equal(seasonLengthSecs, INITIAL_SEASON_DAY_LENGTH_SECS, "The initial season length is not correct");

        let tx = await rootInstance.setSeasonLength(NEW_SEASON_LENGTH, { from: adminUser });
        currentSeason = await brightInstance.getCurrentSeason();
        seasonLengthSecs = BN(currentSeason[2]).toString();
        assert.equal(seasonLengthSecs, (NEW_SEASON_LENGTH * DAY_TO_SECS), "The season length change was not done correctly");
    });

    it("should give error changing the season length with an invalid address", async () => {
        const web3 = openConnection();
        var BN = web3.utils.BN;
        await truffleAssert.reverts(
            rootInstance.setSeasonLength(NEW_SEASON_LENGTH, { from: invalidUser }),
            "The origin address is not allowed"
        );
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
