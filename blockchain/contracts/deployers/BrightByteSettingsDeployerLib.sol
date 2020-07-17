pragma solidity 0.5.17;

import "../BrightByteSettings.sol";


library BrightByteSettingsDeployerLib {

    function deploy() public returns (address) {
        return address(new BrightByteSettings());
    }
}