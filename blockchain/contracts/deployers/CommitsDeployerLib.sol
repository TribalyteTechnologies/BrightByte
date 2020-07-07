pragma solidity 0.5.2;

import "../Commits.sol";


library CommitsDeployerLib {

    function deploy() public returns (address) {
        return address(new Commits());
    }
}