pragma solidity 0.5.2;

import "../Bright.sol";


library BrightDeployerLib {

    function deploy() public returns (address) {
        return address(new Bright());
    }

    function inviteUserEmail(address brightAddress, string memory email) public {
        Bright remoteBright = Bright(brightAddress);
        remoteBright.inviteUserEmail(email);
    }
}