pragma solidity 0.4.22;

import "../Root.sol";


library RootDeployerLib {

    function deploy(address bright, address commits, address threshold, address eventDispatcher, address userAdmin,uint256 teamId) public returns (address) {
        return new Root(bright, commits, threshold, eventDispatcher, userAdmin, teamId);
    }
}