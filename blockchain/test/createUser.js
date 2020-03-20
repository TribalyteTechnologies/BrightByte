const Bright = artifacts.require("./Bright.sol");
const name = "Manuel";
const email = "manuel@example.com";

contract("Bright", accounts => {
    let account = accounts[8];
    it("should create account if it is not created yet", () => {
        let brightInstance;
        return Bright.deployed()
            .then(instance => {
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
        return Bright.deployed()
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
