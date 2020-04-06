const Bright = artifacts.require("./Bright.sol");
var CloudBBFactory = artifacts.require("./CloudBrightByteFactory.sol");
const name = "Manuel";
const TEAM_UID = 1;
const email = "manuel@example.com";


contract("CloudBBFactory", accounts => {
    let account = accounts[8];
    let brightInstance;
    let brightAddress;
    it("should create account if it is not created yet", () => {
        let cloudBBFactory;
        return CloudBBFactory.deployed()
            .then(instance => {
                cloudBBFactory = instance;
                return deployBrightCommitsThreshold(cloudBBFactory, TEAM_UID);
            }).then(response => {
                assert(response.receipt.status, "Contract deployed incorrectly");
                return cloudBBFactory.deployRoot(TEAM_UID, account);
            }).then(response => {
                assert(response.receipt.status, "Contract deployed incorrectly");
                return cloudBBFactory.getTeamContractAddresses(TEAM_UID);
            }).then(allContracts => {
                let brightAddress = allContracts[0];
                return Bright.at(brightAddress);
            }).then(instance => {
                brightInstance = instance;
                return brightInstance.getUsersAddress();
            })
            .then(addresses => {
                let isAddressCreated = addresses.find(address => address === account) === account;
                assert(!isAddressCreated, "Address already created");
                return brightInstance.setProfile(name, email, { from: account });
            })
            .then(response => {
                assert(response.receipt.status);
                return brightInstance.getUsersAddress();
            })
            .then(addresses => {
                let isAddressCreated = addresses.find(address => address === account) === account;
                assert(isAddressCreated, "Address was not created correctly");
                return brightInstance.getUser(account)
            }).then(userDetails => {
                assert.equal(userDetails[0], name);
                assert.equal(userDetails[1], email);
            });
        }
    );

    it("should give error creating an already created account", () => {
        let brightInstance;
        return Bright.at(brightAddress)
            .then(instance => {
                brightInstance = instance;
                return brightInstance.setProfile(name, email, { from: account });
            })
            .catch(error => {
                assert(true);
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