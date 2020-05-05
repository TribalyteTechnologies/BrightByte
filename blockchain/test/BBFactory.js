var CloudBbFactory = artifacts.require("./CloudBrightByteFactory.sol");
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const TEAM_UID = 1;
const INITIAL_SEASON_LENGTH = 15;

contract("CloudBbFactory", accounts => {
    let account = accounts[8];
    it("should deploy all the contracts for a given team", () => {
        let cloudBbFactory;
        return CloudBbFactory.deployed()
            .then(instance => {
                cloudBbFactory = instance;
                return deployBrightCommitsThreshold(cloudBbFactory, TEAM_UID);
            }).then(response => {
                assert(response.receipt.status, "Contract deployed incorrectly");
                return cloudBbFactory.deployRoot(TEAM_UID, account, INITIAL_SEASON_LENGTH);
            }).then(response => {
                assert(response.receipt.status, "Contract deployed incorrectly");
                return cloudBbFactory.getTeamContractAddresses(TEAM_UID);
            }).then(allContracts => {
                let areContractsDeployedCorrectly = !Object.values(allContracts).some(address => address === EMPTY_ADDRESS);
                assert(areContractsDeployedCorrectly, "All or some contracts were deployed incorrectly");
                return cloudBbFactory.getEventDispatcherAddress();
            })
            .then(eventDispatcherAddress => {
                assert(eventDispatcherAddress !== EMPTY_ADDRESS, "EventyDispatcher was deployed incorrectly");
            });
        }
    );

    it("should fail deploying all the contracts for a given team", () => {
        let cloudBbFactory;
        return CloudBbFactory.deployed()
            .then(instance => {
                cloudBbFactory = instance;
                return deployBrightCommitsThreshold(cloudBbFactory, TEAM_UID);
            })
            .then(response => {
                assert(response.receipt.status, "Contract deployed incorrectly");
                return cloudBbFactory.getTeamContractAddresses(TEAM_UID);
            }).then(allContracts => {
                let areContractsDeployedCorrectly = !Object.values(allContracts).some(address => address === EMPTY_ADDRESS);
                assert(!areContractsDeployedCorrectly, "All or some contracts were deployed correctly");
            });
        }
    );
});

function deployBrightCommitsThreshold(cloudBbFactory, teamUId) {
    return cloudBbFactory.deployBright(teamUId)
    .then(response => {
        assert(response.receipt.status, "Contract deployed incorrectly");
        return cloudBbFactory.deployCommits(teamUId);
    }).then(response => {
        assert(response.receipt.status, "Contract deployed incorrectly");
        return cloudBbFactory.deployThreshold(teamUId);
    });
}
