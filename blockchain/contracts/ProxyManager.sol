pragma solidity 0.5.17;

import "./CloudTeamManager.sol";

contract ProxyManager is Initializable {

    bytes32 private currentVersion;
    bytes32[] private availableVersions;
    mapping (bytes32 => address) private versionAddresses;
    address private owner;

    modifier onlySender(address userHash) {
        require (msg.sender == userHash, "Message sender is not the same as userHash");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Message sender is not owner");
        _;
    }

    function initialize(string memory version, address versionAddress) public initializer {
        currentVersion = keccak256(abi.encodePacked(version));
        versionAddresses[currentVersion] = versionAddress;
        availableVersions.push(currentVersion);
    }

    function setNewVersion(string memory version, address versionAddress) public onlyOwner {
        currentVersion = keccak256(abi.encodePacked(version));
        versionAddresses[currentVersion] = versionAddress;
        availableVersions.push(currentVersion);
    }

    function getAvailableVersions() public view returns (bytes32[] memory) {
        return availableVersions;
    }

    function getCurrentVersion() public view returns (bytes32) {
        return currentVersion;
    }

    function getVersionContracts(bytes32 version) public view returns (address) {
        return versionAddresses[version];
    }

    function getTeamContractAddresses(bytes32 version, uint256 teamUid) public view returns (address, address, address, address) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getTeamContractAddresses(teamUid);
    }

    function getTeamName(bytes32 version, uint256 teamUid) public view returns (bytes32) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getTeamName(teamUid);
    }

    function isUserEmailInvited(bytes32 version, bytes32 emailId) public view returns (bool) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.isUserEmailInvited(emailId);
    }

    function isUserEmailInvitedToTeam(bytes32 version, bytes32 emailId, uint256 teamUid) public view returns (bool) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.isUserEmailInvitedToTeam(emailId, teamUid);
    }

    function getAllTeamInvitationsByEmail(bytes32 version, bytes32 emailId) public view returns (uint256[] memory) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getAllTeamInvitationsByEmail(emailId);
    }

    function getVersionsInvitations(bytes32 emailId) public view returns (bytes32[] memory) {
        uint256 versionCount = availableVersions.length;
        bytes32[] memory versions = new bytes32[](versionCount);
        for (uint256 i = 0; i < versionCount; i++) {
            uint256[] memory teamsInvitations;
            teamsInvitations = getAllTeamInvitationsByEmail(availableVersions[i], emailId);
            if (teamsInvitations.length > 0) {
                versions[i] = availableVersions[i];
            }
        }
        return versions;
    }

    function getInvitedUserInfo(bytes32 version, bytes32 emailId, uint256 teamUid) public view
    returns (uint256, uint256, CloudTeamManager.UserType) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getInvitedUserInfo(emailId, teamUid);
    }

    function getUserTeam(bytes32 version, address memberAddress) public view returns (uint256[] memory) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getUserTeam(memberAddress);
    }

    function getUserTeamVersions(address memberAddress) public view returns (bytes32[] memory) {
        uint256 versionCount = availableVersions.length;
        bytes32[] memory versions = new bytes32[](versionCount);
        for (uint256 i = 0; i < versionCount; i++) {
            uint256[] memory userTeam;
            userTeam = getUserTeam(availableVersions[i], memberAddress);
            if (userTeam.length > 0) {
                versions[i] = availableVersions[i];
            }
        }
        return versions;
    }

    function getUserInfo(bytes32 version, uint256 teamUid, address memberAddress) public view returns (CloudTeamManager.UserType, bytes32) {
        CloudTeamManager remoteManager = CloudTeamManager(versionAddresses[version]);
        return remoteManager.getUserInfo(teamUid, memberAddress);
    }
}
