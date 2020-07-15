pragma solidity 0.5.17;

import "../Threshold.sol";


library ThresholdDeployerLib {

    function deploy() public returns (address) {
        return address(new Threshold());
    }
}