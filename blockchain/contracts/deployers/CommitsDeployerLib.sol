// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "../Commits.sol";


library CommitsDeployerLib {

    function deploy() public returns (address) {
        return address(new Commits());
    }
}