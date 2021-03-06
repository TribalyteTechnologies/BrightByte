// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/proxy/Initializable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./CloudBrightByteFactory.sol";
import "./CloudProjectStore.sol";
import { UtilsLib } from "./UtilsLib.sol";

contract CloudTeamManager is Initializable {
    using SafeMath for uint256;
    uint256 constant public INVITATION_DURATION_IN_SECS = 1 * 60 * 60 * 24 * 7;
    enum UserType { NotRegistered, Admin, Member }
    uint256 private seasonLengthInDays;
    uint256 private teamCount;
    address private owner;
    address private bbFactoryAddress;
    CloudBrightByteFactory private remoteBbFactory;
    address private projStoreAddress;
    CloudProjectStore private remoteProjStore;
    mapping (address => uint256[]) private userTeams;

    struct Team {
        uint256 uId;
        bytes32 teamName;
        address[] usersList;
        bytes32[] invitedUsersEmailList;
        mapping (address => TeamMember) users;
    }

    struct TeamMember {
        bytes32 emailId;
        UserType userType;
    }

    mapping (uint256 => Team) private createdTeams;

    struct InvitationStatus {
        bool isInvited;
        uint256 expirationTime;
        UserType userType;
    }

    struct UserData {
        uint256[] invitedTeams;
        mapping (uint256 => InvitationStatus) userTeams;
    }

    mapping (bytes32 => UserData) private usersRegister;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Message sender is not owner");
        _;
    }

    modifier onlyAdmins(uint256 teamUid) {
        Team storage team = createdTeams[teamUid];
        require(team.users[msg.sender].userType == UserType.Admin, "Message sender is not admin");
        _;
    }

    modifier onlyMembersOrAdmins(uint256 teamUid) {
        Team storage team = createdTeams[teamUid];
        require(
            team.users[msg.sender].userType == UserType.Member || team.users[msg.sender].userType == UserType.Admin, "Message sender is neither admin or member");
        _;
    }

    modifier onlySender(address userHash) {
        require (msg.sender == userHash, "Message sender is not the same as userHash");
        _;
    }

    function initialize(address bbFactoryAddr, uint256 seasonLength) public initializer {
        owner = msg.sender;
        teamCount = 0;
        bbFactoryAddress = bbFactoryAddr;
        remoteBbFactory = CloudBrightByteFactory(bbFactoryAddress);
        projStoreAddress = address(new CloudProjectStore());
        remoteProjStore = CloudProjectStore(projStoreAddress);
        remoteProjStore.initialize(address(this));
        bytes32 defaultEmail = keccak256(abi.encodePacked("unregistered@brightbyteapp.com"));
        bytes32 defaultTeamName = keccak256(abi.encodePacked("Default team"));
        createTeam(defaultEmail, defaultTeamName);
        seasonLengthInDays = seasonLength;
    }

    function createTeam(bytes32 emailId, bytes32 teamName) public returns (uint256) {
        Team storage team = createdTeams[teamCount];
        team.uId = teamCount;
        team.teamName = teamName;
        address userAddr = teamCount == 0 ? address(0) : msg.sender;
        addToTeam(teamCount, userAddr, emailId, UserType.Admin);
        teamCount++;
        return teamCount - 1;
    }

    function deployBright(uint256 teamUid) public onlyAdmins(teamUid) {
        remoteBbFactory.deployBright(teamUid);
    }

    function deployCommits(uint256 teamUid) public onlyAdmins(teamUid) {
        remoteBbFactory.deployCommits(teamUid);
    }

    function deploySettings(uint256 teamUid) public onlyAdmins(teamUid) {
        remoteBbFactory.deploySettings(teamUid);
    }

    function deployRoot(bytes32 emailId, uint256 teamUid, uint256 seasonLength) public onlyAdmins(teamUid) {
        remoteBbFactory.deployRoot(teamUid, msg.sender, seasonLength);
        remoteBbFactory.inviteUserEmail(teamUid, emailId);
        remoteBbFactory.setVersion(teamUid);
    }

    function getTeamContractAddresses(uint256 teamUid) public view onlyMembersOrAdmins(teamUid) returns (address, address, address, address) {
        return remoteBbFactory.getTeamContractAddresses(teamUid);
    }

    function getTeamName(uint256 teamUid) public view returns (bytes32) {
        return createdTeams[teamUid].teamName;
    }

    function setTeamName(uint256 teamUid, bytes32 teamName) public onlyAdmins(teamUid) {
        createdTeams[teamUid].teamName = teamName;
    }

    function toggleUserType(uint256 teamUid, address memberAddress) public onlyAdmins(teamUid) {
        Team storage team = createdTeams[teamUid];
        UserType userType = team.users[memberAddress].userType;
        bytes32 emailId;
        if (userType == UserType.Admin) {
            require(memberAddress != owner, "Message sender is not owner");
        }
        emailId = removeFromTeam(teamUid, memberAddress);
        addToTeam(teamUid, memberAddress, emailId, userType == UserType.Admin ? UserType.Member : UserType.Admin);
        if(userType == UserType.Admin) {
            remoteBbFactory.addAdminUser(teamUid, memberAddress);
        }
    }

    function inviteToTeam(uint256 teamUid, bytes32 emailId, UserType userType, uint256 expSecs) public onlyAdmins(teamUid) {
        uint256 exp = expSecs;
        if (exp == 0) {
            exp = INVITATION_DURATION_IN_SECS;
        }
        require(userType == UserType.Admin || userType == UserType.Member, "UserType is neither admin or member");
        require(teamUid != 0, "Cannot invite to default team");
        InvitationStatus storage user = usersRegister[emailId].userTeams[teamUid];
        if (!user.isInvited) {
            usersRegister[emailId].invitedTeams.push(teamUid);
            createdTeams[teamUid].invitedUsersEmailList.push(emailId);
        }
        user.isInvited = true;
        user.userType = userType;
        user.expirationTime = block.timestamp + exp;
    }

    function removeInvitationToTeam(uint256 teamUid, bytes32 emailId) public onlyAdmins(teamUid) {
        removeInvitation(teamUid, emailId);
    }

    function isUserEmailInvited(bytes32 emailId) public view returns (bool) {
        return usersRegister[emailId].invitedTeams.length > 0;
    }

    function isUserEmailInvitedToTeam(bytes32 emailId, uint256 teamUid) public view returns (bool) {
        return usersRegister[emailId].userTeams[teamUid].isInvited;
    }

    function getAllTeamInvitationsByEmail(bytes32 emailId) public view returns (uint256[] memory) {
        return usersRegister[emailId].invitedTeams;
    }

    function getInvitedUserInfo(bytes32 emailId, uint256 teamUid) public view returns (uint256, uint256, UserType) {
        InvitationStatus storage user = usersRegister[emailId].userTeams[teamUid];
        return (teamUid, user.expirationTime, user.userType);
    }

    function registerToTeam(address memberAddress, bytes32 emailId, uint256 teamUid) public onlySender(memberAddress) {
        require(teamUid != 0 && isUserEmailInvitedToTeam(emailId, teamUid), "TeamUid is 0 or email is not invited to team");
        if (usersRegister[emailId].userTeams[teamUid].expirationTime > block.timestamp) {
            addToTeam(teamUid, memberAddress, emailId, UserType.NotRegistered);
            remoteBbFactory.inviteUserEmail(teamUid, emailId);
            if(createdTeams[teamUid].users[memberAddress].userType == UserType.Admin) {
                remoteBbFactory.addAdminUser(teamUid, memberAddress);
            }
        } else {
            removeInvitation(teamUid, emailId);
        }
    }

    function getTeamMembers(uint256 teamUid) public view returns (address[] memory, address[] memory) {
        uint256 adminsCount = 0;
        uint256 x = 0;
        uint256 y = 0;
        Team storage team = createdTeams[teamUid];
        address[] memory users = team.usersList;
        for (uint256 j = 0; j < users.length; j++) {
            if (team.users[users[j]].userType == UserType.Admin) {
                adminsCount++;
            }
        }
        uint256 membersCount = users.length - adminsCount;
        address[] memory admins = new address[](adminsCount);
        address[] memory members = new address[](membersCount);

        for (uint256 i = 0; i < users.length; i++) {
            address userAddress = users[i];
            if (team.users[userAddress].userType == UserType.Admin) {
                admins[x] = userAddress;
                x++;
            } else {
                members[y] = userAddress;
                y++;
            }
        }
        return (admins, members);
    }

    function getUserTeam(address memberAddress) public view returns (uint256[] memory) {
        return userTeams[memberAddress];
    }

    function getUserType(uint256 teamUid, address memberAddress) public view returns (UserType) {
        return createdTeams[teamUid].users[memberAddress].userType;
    }

    function getUserInfo(uint256 teamUid, address memberAddress) public view returns (UserType, bytes32) {
        TeamMember memory teamMember = createdTeams[teamUid].users[memberAddress];
        return (teamMember.userType, teamMember.emailId);
    }

    function getInvitedUsersList(uint256 teamUid) public view returns (bytes32[] memory) {
        Team storage team = createdTeams[teamUid];
        return team.invitedUsersEmailList;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "NewOwner address is 0");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function removeFromTeam(uint256 teamUid, address memberAddress) public onlyAdmins(teamUid) returns (bytes32) {
        require(memberAddress != owner, "Message sender is not owner");
        Team storage team = createdTeams[teamUid];
        bytes32 emailId = team.users[memberAddress].emailId;
        delete team.users[memberAddress];
        UtilsLib.removeAddressFromArray(team.usersList, memberAddress);
        UtilsLib.removeUintFromArray(userTeams[memberAddress], teamUid);
        delete usersRegister[emailId].userTeams[teamUid];
        return emailId;
    }

    function addProject(uint256 teamUid, string memory project) public onlyMembersOrAdmins(teamUid) {
        remoteProjStore.addProject(teamUid, project);
    }

    function clearAllProjects(uint256 teamUid) public onlyMembersOrAdmins(teamUid) {
        remoteProjStore.clearAllProjects(teamUid);
    }

    function getAllProjects(uint256 teamUid, uint256 blockPosition) public onlyMembersOrAdmins(teamUid)
        view returns (string memory, string memory, string memory, string memory, string memory) {
        return remoteProjStore.getAllProjects(teamUid, blockPosition);
    }

    function getProjectPageCount(uint256 teamUid) public onlyMembersOrAdmins(teamUid) view returns (uint256) {
        return remoteProjStore.getProjectPageCount(teamUid);
    }

    function doesTeamExists(uint256 teamUid) public onlyMembersOrAdmins(teamUid) view returns (bool) {
        return remoteProjStore.doesTeamExists(teamUid);
    }

    function removeInvitation(uint256 teamUid, bytes32 emailId) private {
        UserData storage user = usersRegister[emailId];
        UtilsLib.removeUintFromArray(user.invitedTeams, teamUid);
        delete user.userTeams[teamUid];
        Team storage team = createdTeams[teamUid];
        UtilsLib.removeBytes32FromArray(team.invitedUsersEmailList, emailId);
    }

    function addToTeam(uint256 teamUid, address memberAddress, bytes32 emailId, UserType userType) private {
        Team storage team = createdTeams[teamUid];
        InvitationStatus storage user = usersRegister[emailId].userTeams[teamUid];
        UserType userTp = userType;
        if (userTp == UserType.NotRegistered) {
            userTp = user.userType;
            require(
                userTp == UserType.Admin || userTp == UserType.Member,
                "UserType is neither admin or member"
            );
        }
        team.users[memberAddress].emailId = emailId;
        team.users[memberAddress].userType = userTp;
        team.usersList.push(memberAddress);
        userTeams[memberAddress].push(teamUid);
        removeInvitation(teamUid, emailId);
    }

    function setEventDispatcher(address eventAddress) public onlyOwner {
        remoteBbFactory.setEventDispatcher(eventAddress);
    }

    function getEventDispatcherAddress() public view returns (address) {
        return remoteBbFactory.getEventDispatcherAddress();
    }
}
