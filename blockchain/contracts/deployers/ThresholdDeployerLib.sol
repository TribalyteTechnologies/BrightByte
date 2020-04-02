pragma solidity 0.4.22;

import "../Threshold.sol";


library ThresholdDeployerLib {

    function deploy() public returns (address) {
        return new Threshold();
    }
}