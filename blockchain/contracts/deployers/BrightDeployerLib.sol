pragma solidity 0.4.22;

import "../Bright.sol";


library BrightDeployerLib {

    function deploy() public returns (address) {
        return new Bright();
    }
}