pragma solidity 0.4.22;

import "../Commits.sol";


library CommitsDeployerLib {

    function deploy() public returns (address) {
        return new Commits();
    }
}