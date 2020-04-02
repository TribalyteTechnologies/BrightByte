var CloudBBFactory = artifacts.require("./CloudBrightByteFactory.sol");
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const TEAM_UID = 1;
const SEASON_LENGHT_IN_DAYS = 90;

contract("CloudBBFactory", accounts => {
    it("should deploy all the contracts for a given team", () => {
        let cloudBBFactory;
        return CloudBBFactory.deployed()
            .then(instance => {
                cloudBBFactory = instance;
                return deployBrightCommitsThreshold(cloudBBFactory, TEAM_UID);
            }).then(response => {
                assert(response.receipt.status, "Contract deployed incorrectly");
                return cloudBBFactory.deployRoot(TEAM_UID, SEASON_LENGHT_IN_DAYS);
            }).then(response => {
                assert(response.receipt.status, "Contract deployed incorrectly");
                return cloudBBFactory.getTeamContractAddresses(TEAM_UID);
            }).then(allContracts => {
                let areContractsDeployedCorrectly = !Object.values(allContracts).some(address => address === EMPTY_ADDRESS);
                assert(areContractsDeployedCorrectly, "All or some contracts were deployed incorrectly");
                return cloudBBFactory.getEventDispatcherAddress();
            })
            .then(eventDispatcherAddress => {
                assert(eventDispatcherAddress !== EMPTY_ADDRESS, "EventyDispatcher was deployed incorrectly");
            });
        }
    );

    it("should fail deploying all the contracts for a given team", () => {
        let cloudBBFactory;
        return CloudBBFactory.deployed()
            .then(instance => {
                cloudBBFactory = instance;
                return deployBrightCommitsThreshold(cloudBBFactory, TEAM_UID);
            })
            .then(response => {
                assert(response.receipt.status, "Contract deployed incorrectly");
                return cloudBBFactory.getTeamContractAddresses(TEAM_UID);
            }).then(allContracts => {
                let areContractsDeployedCorrectly = !Object.values(allContracts).some(address => address === EMPTY_ADDRESS);
                assert(!areContractsDeployedCorrectly, "All or some contracts were deployed correctly");
            });
        }
    );
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
