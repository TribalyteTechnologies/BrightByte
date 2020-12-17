// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "../Root.sol";

library RootDeployerLib {

    function deploy(
        address bright, address commits, address settings, address eventDispatcher,
        address userAdmin, uint256 teamId, uint256 seasonLength)public returns (address) {
        Root remoteRoot = new Root();
        remoteRoot.initialize(bright, commits, settings, eventDispatcher, userAdmin, teamId, seasonLength);
        return address(remoteRoot);
    }

    function setVersion(address rootAddress, uint256 version) public {
        Root remoteRoot = Root(rootAddress);
        remoteRoot.setVersion(version);
    }

    function addAdminUser(address rootAddress, address memberAddress) public {
        Root remoteRoot = Root(rootAddress);
        remoteRoot.addAdminUser(memberAddress);
    }
}