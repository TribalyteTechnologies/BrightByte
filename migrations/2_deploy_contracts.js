var Bright = artifacts.require("./Bright.sol");
var StringUtils = artifacts.require("./StringUtils.sol");

module.exports = function(deployer) {
    deployer.deploy(StringUtils);
    deployer.link(StringUtils, Bright);
    deployer.deploy(Bright, {privateFrom: "wsyiYRPs8pWjw1NsTdkmzYordSv8GCCXS7tvk2CM53g="})


};
