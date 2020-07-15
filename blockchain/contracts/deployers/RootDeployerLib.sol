pragma solidity 0.5.17;

import "../Root.sol";


library RootDeployerLib {

    function deploy(
        address bright, address commits, address threshold, address eventDispatcher,
        address userAdmin, uint256 teamId, uint256 seasonLength)public returns (address) {
        return address(new Root(bright, commits, threshold, eventDispatcher, userAdmin, teamId, seasonLength));
    }

    function setVersion(address rootAddress, bytes32 version) public {
        Root remoteRoot = Root(rootAddress);
        remoteRoot.setVersion(version);
    }
}