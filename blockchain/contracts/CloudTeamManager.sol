pragma solidity 0.4.22;

import "./CloudBrightByteFactory.sol";
import "./CloudProjectStore.sol";

contract CloudTeamManager {

    struct Team {
        uint256 uId;
        string teamName;
        uint256 adminsCount;
        uint256 membersCount;
        uint256 invitedUsersCount;
        mapping (uint256 => TeamMember) admins;
        mapping (uint256 => TeamMember) members;
        mapping (string => UserType) invitedUsersEmail;
        mapping (address => UserType) users;
        mapping (uint256 => string) invitedUsersEmailList;
    }

    struct TeamMember {
        address memberAddress;
        string email;
    }

    struct AddressTeamMap {
        uint256 teamsCount;
        mapping (uint256 => uint256) indexTeamUidMap;
        mapping (uint256 => uint256) teamUidIndexMap;
    }

    struct InvitedUser {
        uint256 numberOfInvitations;
        mapping (uint256 => uint256) indexTeamUidMap;
        mapping (uint256 => uint256) teamExpirationMap;
    }

    enum UserType { NotRegistered, Admin, Member }

    uint256 INVITATION_DURATION_IN_SECS = 1 * 60 * 60 * 24 * 7;
    uint256 INVITED_USERS_BLOCK_SIZE = 5;

    mapping (uint256 => Team) private createdTeams;
    mapping (address => AddressTeamMap) private userTeamMap;
    mapping (string => InvitedUser) private invitedUserTeamMap;

    uint256 private seasonLengthInDays;
    uint256 private teamCount;
    address private owner;

    address private bbFactoryAddress;
    CloudBrightByteFactory private remoteBbFactory;

    address private projStoreAddress;
    CloudProjectStore private remoteProjStore;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address bbFactoryAddr, uint256 seasonLength) public {
        owner = msg.sender;
        teamCount = 0;
        bbFactoryAddress = bbFactoryAddr;
        remoteBbFactory = CloudBrightByteFactory(bbFactoryAddress);
        projStoreAddress = new CloudProjectStore(this);
        remoteProjStore = CloudProjectStore(projStoreAddress);
        createTeam("unregistered@brightbyteapp.com", "Default team");
        seasonLengthInDays = seasonLength;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Message sender is not owner");
        _;
    }

    modifier onlyAdmins(uint256 teamUid) {
        Team storage team = createdTeams[teamUid];
        require(team.users[msg.sender] == UserType.Admin, "Message sender is not admin");
        _;
    }

    modifier onlyMembersOrAdmins(uint256 teamUid) {
        Team storage team = createdTeams[teamUid];
        require(
            team.users[msg.sender] == UserType.Member || team.users[msg.sender] == UserType.Admin, "Message sender is neither admin or member");
        _;
    }

    modifier onlySender(address userHash) {
        require (msg.sender == userHash, "Message sender is not the same as userHash");
        _;
    }

    function createTeam(string email, string teamName) public returns (uint256) {
        Team memory team = Team(teamCount, teamName, 0, 0, 0);
        createdTeams[teamCount] = team;
        address userAddr = teamCount == 0 ? address(0) : msg.sender;
        addToTeam(teamCount, userAddr, email, UserType.Admin);
        teamCount++;
        return teamCount - 1;
    }

    function deployBright(uint256 teamUid) public onlyAdmins(teamUid) {
        remoteBbFactory.deployBright(teamUid);
    }

    function deployCommits(uint256 teamUid) public onlyAdmins(teamUid) {
        remoteBbFactory.deployCommits(teamUid);
    }

    function deployThreshold(uint256 teamUid) public onlyAdmins(teamUid) {
        remoteBbFactory.deployThreshold(teamUid);
    }

    function deployRoot(string email, uint256 teamUid, uint256 seasonLength) public onlyAdmins(teamUid) {
        remoteBbFactory.deployRoot(teamUid, createdTeams[teamUid].admins[0].memberAddress, seasonLength);
        remoteBbFactory.inviteUserEmail(teamUid, email);
    }

    function getTeamContractAddresses(uint256 teamUid) public view onlyMembersOrAdmins(teamUid) returns (address, address, address, address) {
        return remoteBbFactory.getTeamContractAddresses(teamUid);
    }

    function getTeamName(uint256 teamUid) public view returns (string) {
        return createdTeams[teamUid].teamName;
    }

    function setTeamName(uint256 teamUid, string teamName) public onlyAdmins(teamUid) {
        createdTeams[teamUid].teamName = teamName;
    }

    function toggleUserType(uint256 teamUid, address memberAddress) public onlyAdmins(teamUid) {
        Team storage team = createdTeams[teamUid];
        UserType userType = team.users[memberAddress];
        string memory email;
        if (userType == UserType.Admin) {
            require(memberAddress != owner, "Message sender is not owner");
        }
        email = removeFromTeam(teamUid, memberAddress);
        addToTeam(teamUid, memberAddress, email, userType == UserType.Admin ? UserType.Member : UserType.Admin);
    }

    function inviteToTeam( uint256 teamUid, string email, UserType userType, uint256 expSecs) public onlyAdmins(teamUid) {
        uint256 exp = expSecs;
        if (exp == 0) {
            exp = INVITATION_DURATION_IN_SECS;
        }
        require(userType == UserType.Admin || userType == UserType.Member, "UserType is neither admin or member");
        uint256 userIndex;
        UserType userTp;
        (userIndex, userTp) = getUserIndexAndType(teamUid, msg.sender);
        Team storage team = createdTeams[teamUid];
        if (keccak256(team.admins[userIndex].email) != keccak256(email)) {
            team.invitedUsersEmail[email] = userType;
            if (!isUserEmailInvitedToTeam(email, teamUid)) {
                team.invitedUsersEmailList[team.invitedUsersCount] = email;
                team.invitedUsersCount++;
            }
            InvitedUser storage user = invitedUserTeamMap[email];
            require(teamUid != 0, "Cannot invite to default team");
            if (user.teamExpirationMap[teamUid] == 0) {
                user.indexTeamUidMap[user.numberOfInvitations] = teamUid;
                user.numberOfInvitations++;
            }
            user.teamExpirationMap[teamUid] = now + exp;
        }
    }

    function removeInvitationToTeam(uint256 teamUid, string email) public onlyAdmins(teamUid) {
        removeInvitation(teamUid, email);
    }

    function isUserEmailInvited(string email) public view returns (bool) {
        return invitedUserTeamMap[email].numberOfInvitations != 0;
    }

    function isUserEmailInvitedToTeam(string email, uint256 teamUid) public view returns (bool) {
        return invitedUserTeamMap[email].teamExpirationMap[teamUid] != 0;
    }

    function getAllTeamInvitationsByEmail(string email) public view returns (uint256[]) {
        InvitedUser storage user = invitedUserTeamMap[email];
        uint256[] memory teamUidInvitations = new uint256[](user.numberOfInvitations);
        for (uint256 i = 0; i < user.numberOfInvitations; i++) {
            uint256 teamUid = user.indexTeamUidMap[i];
            if (teamUid != 0) {
                teamUidInvitations[i] = teamUid;
            }
        }
        return teamUidInvitations;
    }

    function getInvitedUserInfo(string email, uint256 teamUid) public view returns (uint256, uint256, UserType) {
        InvitedUser storage invitedUser = invitedUserTeamMap[email];
        UserType userType = createdTeams[teamUid].invitedUsersEmail[email];
        return (teamUid, invitedUser.teamExpirationMap[teamUid], userType);
    }

    function registerToTeam( address memberAddress, string email, uint256 teamUid) public onlySender(memberAddress) {
        require(teamUid != 0 && isUserEmailInvitedToTeam(email, teamUid), "TeamUid is 0 or email is not invited to team");
        if (invitedUserTeamMap[email].teamExpirationMap[teamUid] > now) {
            addToTeam(teamUid, memberAddress, email, UserType.NotRegistered);
            remoteBbFactory.inviteUserEmail(teamUid, email);
        } else {
            removeInvitation(teamUid, email);
        }
    }

    function getTeamMembers(uint256 teamUid) public view returns (address[], address[]) {
        uint256 adminsCount = createdTeams[teamUid].adminsCount;
        uint256 membersCount = createdTeams[teamUid].membersCount;
        address[] memory admins = new address[](adminsCount);
        address[] memory members = new address[](membersCount);
        for (uint256 i = 0; i < adminsCount; i++) {
            admins[i] = createdTeams[teamUid].admins[i].memberAddress;
        }
        for (uint256 j = 0; j < membersCount; j++) {
            members[j] = createdTeams[teamUid].members[j].memberAddress;
        }
        return (admins, members);
    }

    function getUserTeam(address memberAddress) public view returns (uint256[]) {
        AddressTeamMap storage addrTeamMap = userTeamMap[memberAddress];
        uint256[] memory teamUids = new uint256[](addrTeamMap.teamsCount);
        for (uint256 i = 0; i < addrTeamMap.teamsCount; i++) {
            teamUids[i] = addrTeamMap.indexTeamUidMap[i];
        }
        return teamUids;
    }

    function getUserType(uint256 teamUid, address memberAddress) public view returns (UserType) {
        return createdTeams[teamUid].users[memberAddress];
    }

    function getUserInfo(uint256 teamUid, address memberAddress) public view returns (uint256, UserType, string) {
        Team storage team = createdTeams[teamUid];
        uint256 userIndex;
        UserType userType;
        (userIndex, userType) = getUserIndexAndType(teamUid, memberAddress);
        string memory email;
        if (userType == UserType.Admin) {
            email = team.admins[userIndex].email;
        } else if (userType == UserType.Member) {
            email = team.members[userIndex].email;
        }
        return (userIndex, userType, email);
    }

    function getInvitedUsersList(uint256 teamUid, uint256 blockPosition) public view returns (string, string, string, string, string) {
        Team storage team = createdTeams[teamUid];
        string[] memory emails = new string[](INVITED_USERS_BLOCK_SIZE);
        uint256 start = blockPosition * INVITED_USERS_BLOCK_SIZE;
        uint256 end = start + INVITED_USERS_BLOCK_SIZE;
        for (uint256 i = start; i < end; i++) {
            string memory currentEmail = team.invitedUsersEmailList[i];
            emails[i - start] = currentEmail;
        }
        return (emails[0], emails[1], emails[2], emails[3], emails[4]);
    }

    function getNumberOfInvitedBlockPositions(uint256 teamUid) public view returns (uint256) {
        Team storage team = createdTeams[teamUid];
        uint256 blockPositions = 0;
        if (team.invitedUsersCount != 0) {
            blockPositions = team.invitedUsersCount /
                INVITED_USERS_BLOCK_SIZE;
            if (team.invitedUsersCount % INVITED_USERS_BLOCK_SIZE != 0) {
                blockPositions++;
            }
            blockPositions--;
        }
        return blockPositions;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "NewOwner address is 0");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function removeFromTeam(uint256 teamUid, address memberAddress) public onlyAdmins(teamUid) returns (string) {
        require(memberAddress != owner, "Message sender is not owner");
        Team storage team = createdTeams[teamUid];
        uint256 userIndex;
        string memory email;
        UserType userType;
        (userIndex, userType, email) = getUserInfo(teamUid, memberAddress);
        if (userType == UserType.Admin) {
            delete team.admins[userIndex];
        } else if (userType == UserType.Member) {
            delete team.members[userIndex];
        }
        delete team.users[memberAddress];

        AddressTeamMap storage addrTeamMap = userTeamMap[memberAddress];
        uint256 teamIndex = addrTeamMap.teamUidIndexMap[teamUid];
        delete addrTeamMap.indexTeamUidMap[teamIndex];
        delete addrTeamMap.teamUidIndexMap[teamUid];

        return email;
    }

    function addProject(uint256 teamUid, string project) public onlyMembersOrAdmins(teamUid) {
        remoteProjStore.addProject(teamUid, project);
    }

    function clearAllProjects(uint256 teamUid) public onlyMembersOrAdmins(teamUid) {
        remoteProjStore.clearAllProjects(teamUid);
    }

    function getAllProjects(uint256 teamUid, uint256 blockPosition) public onlyMembersOrAdmins(teamUid)
        view returns (string, string, string, string, string) {
        return remoteProjStore.getAllProjects(teamUid, blockPosition);
    }

    function getNumberOfProjectBlockPositions(uint256 teamUid) public onlyMembersOrAdmins(teamUid) view returns (uint256) {
        return remoteProjStore.getNumberOfProjectBlockPositions(teamUid);
    }

    function doesTeamExists(uint256 teamUid) public onlyMembersOrAdmins(teamUid) view returns (bool) {
        return remoteProjStore.doesTeamExists(teamUid);
    }

    function removeInvitation(uint256 teamUid, string email) private {
        Team storage team = createdTeams[teamUid];
        InvitedUser storage user = invitedUserTeamMap[email];
        delete team.invitedUsersEmail[email];
        delete user.teamExpirationMap[teamUid];
        for (uint256 i = 0; i < user.numberOfInvitations; i++) {
            if (user.indexTeamUidMap[i] == teamUid) {
                delete user.indexTeamUidMap[i];
                break;
            }
        }
        for (uint256 j = 0; j < team.invitedUsersCount; j++) {
            if (keccak256(team.invitedUsersEmailList[j]) == keccak256(email)) {
                delete team.invitedUsersEmailList[j];
                break;
            }
        }
    }

    function addToTeam( uint256 teamUid, address memberAddress, string email, UserType userType) private {
        Team storage team = createdTeams[teamUid];
        UserType userTp = userType;
        if (userTp == UserType.NotRegistered) {
            userTp = team.invitedUsersEmail[email];
            require(
                userTp == UserType.Admin || userTp == UserType.Member,
                "UserType is neither admin or member"
            );
        }
        if (userTp == UserType.Admin) {
            team.admins[team.adminsCount] = TeamMember(memberAddress, email);
            team.adminsCount++;
            team.users[memberAddress] = UserType.Admin;
        } else if (userTp == UserType.Member) {
            team.members[team.membersCount] = TeamMember(memberAddress, email);
            team.membersCount++;
            team.users[memberAddress] = UserType.Member;
        }
        AddressTeamMap storage addrTeamMap = userTeamMap[memberAddress];
        addrTeamMap.indexTeamUidMap[addrTeamMap.teamsCount] = teamUid;
        addrTeamMap.teamUidIndexMap[teamUid] = addrTeamMap.teamsCount;
        addrTeamMap.teamsCount++;
        removeInvitation(teamUid, email);
    }

    function getUserIndexAndType(uint256 teamUid, address memberAddress)
        private
        view
        returns (uint256, UserType) {
        Team storage team = createdTeams[teamUid];
        UserType memberType = team.users[memberAddress];
        uint256 numberOfUsers = memberType == UserType.Admin ? team.adminsCount : team.membersCount;
        TeamMember memory auxMember;
        for (uint256 i = 0; i < numberOfUsers; i++) {
            if (memberType == UserType.Admin) {
                auxMember = team.admins[i];
            } else if (memberType == UserType.Member) {
                auxMember = team.members[i];
            }
            if (auxMember.memberAddress == memberAddress) {
                return (i, memberType);
            }
        }
        return (0, UserType.NotRegistered);
    }
}
