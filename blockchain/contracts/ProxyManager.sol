// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "./CloudTeamManager.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";

contract ProxyManager is Initializable {

    uint256 private currentVersion;
    uint256[] private availableVersions;
    mapping (uint256 => address) private versionAddresses;
    address private owner;

    modifier onlySender(address userHash) {
        require (msg.sender == userHash, "Message sender is not the same as userHash");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Message sender is not owner");
        _;
    }

    function initialize(uint256 version, address versionAddress) public initializer {
        currentVersion = version;
        versionAddresses[currentVersion] = versionAddress;
        availableVersions.push(currentVersion);
        owner = msg.sender;
    }

    function setNewVersion(uint256 version, address versionAddress) public onlyOwner {
        currentVersion = version;
        versionAddresses[currentVersion] = versionAddress;
        availableVersions.push(currentVersion);
    }

    function getAvailableVersions() public view returns (uint256[] memory) {
        return availableVersions;
    }

    function getCurrentVersion() public view returns (uint256) {
        return currentVersion;
    }

    function getVersionContracts(uint256 version) public view returns (address) {
        return versionAddresses[version];
    }

    function getTeamContractAddresses(uint256 version, uint256 teamUid) public view returns (address, address, address, address) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getTeamContractAddresses(teamUid);
    }

    function getTeamName(uint256 version, uint256 teamUid) public view returns (bytes32) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getTeamName(teamUid);
    }

    function isUserEmailInvited(uint256 version, bytes32 emailId) public view returns (bool) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.isUserEmailInvited(emailId);
    }

    function isUserEmailInvitedToTeam(uint256 version, bytes32 emailId, uint256 teamUid) public view returns (bool) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.isUserEmailInvitedToTeam(emailId, teamUid);
    }

    function getAllTeamInvitationsByEmail(uint256 version, bytes32 emailId) public view returns (uint256[] memory) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getAllTeamInvitationsByEmail(emailId);
    }

    function getVersionsInvitations(bytes32 emailId) public view returns (uint256[] memory) {
        uint256 versionCount = availableVersions.length;
        uint256[] memory versions = new uint256[](versionCount);
        for (uint256 i = 0; i < versionCount; i++) {
            uint256[] memory teamsInvitations;
            teamsInvitations = getAllTeamInvitationsByEmail(availableVersions[i], emailId);
            if (teamsInvitations.length > 0) {
                versions[i] = availableVersions[i];
            }
        }
        return versions;
    }

    function getInvitedUserInfo(uint256 version, bytes32 emailId, uint256 teamUid) public view
    returns (uint256, uint256, CloudTeamManager.UserType) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getInvitedUserInfo(emailId, teamUid);
    }

    function getUserTeam(uint256 version, address memberAddress) public view returns (uint256[] memory) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getUserTeam(memberAddress);
    }

    function getUserTeamVersions(address memberAddress) public view returns (uint256[] memory) {
        uint256 versionCount = availableVersions.length;
        uint256[] memory versions = new uint256[](versionCount);
        for (uint256 i = 0; i < versionCount; i++) {
            uint256[] memory userTeam;
            userTeam = getUserTeam(availableVersions[i], memberAddress);
            if (userTeam.length > 0) {
                versions[i] = availableVersions[i];
            }
        }
        return versions;
    }

    function getUserInfo(uint256 version, uint256 teamUid, address memberAddress) public view returns (CloudTeamManager.UserType, bytes32) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getUserInfo(teamUid, memberAddress);
    }
}
