// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "../Bright.sol";


library BrightDeployerLib {

    function deploy() public returns (address) {
        return address(new Bright());
    }

    function inviteUserEmail(address brightAddress, bytes32 email) public {
        Bright remoteBright = Bright(brightAddress);
        remoteBright.inviteUserEmail(email);
    }
}