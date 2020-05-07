pragma solidity 0.4.22;

import "../Bright.sol";


library BrightDeployerLib {

    function deploy() public returns (address) {
        return new Bright();
    }

    function inviteUserEmail(address brightAddress, string email) public {
        Bright remoteBright = Bright(brightAddress);
        remoteBright.inviteUserEmail(email);
    }
}