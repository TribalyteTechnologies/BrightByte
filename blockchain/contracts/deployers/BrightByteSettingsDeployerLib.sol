// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "../BrightByteSettings.sol";


library BrightByteSettingsDeployerLib {

    function deploy() public returns (address) {
        return address(new BrightByteSettings());
    }
}