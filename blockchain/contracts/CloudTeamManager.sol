pragma solidity 0.4.22;

import "./CloudBrightByteFactory.sol";

contract CloudTeamManager {
    
    struct Team {
        uint256 uId;
        string teamName;
        uint256 adminsCount;
        uint256 membersCount;
        mapping (uint256 => TeamMember) admins;
        mapping (uint256 => TeamMember) members;
        mapping (string => UserType) invitedUsersEmail;
        mapping (address => UserType) users;
    }
    
    struct TeamMember {
        address memberAddress;
        string email;
    }
    
    struct InvitedUser {
        uint256 teamUid;
        uint256 expirationTimestamp;
    }
    
    enum UserType { NotRegistered, Admin, Member }
    
    uint256 INVITATION_DURATION_IN_SECS = 1 * 60 * 60;
    
    mapping (uint256 => Team) private createdTeams;
    mapping (address => uint256) private userTeamMap;
    mapping (string => InvitedUser) private invitedUserTeamMap;
    
    uint256 private seasonLengthInDays;
    uint256 private teamCount;
    address private owner;
    
    address private bbFactoryAddress;
    CloudBrightByteFactory private remoteBbFactory;
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address bbFactoryAddr, uint256 seasonLength) public {
        owner = msg.sender;
        teamCount = 0;
        createTeam("unregistered@brightbyteapp.com", "Default team");
        bbFactoryAddress = bbFactoryAddr;
        remoteBbFactory = CloudBrightByteFactory(bbFactoryAddress);
        seasonLengthInDays = seasonLength;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    modifier onlyAdmins(uint256 teamUid) {
        Team storage team = createdTeams[teamUid];
        require(team.users[msg.sender] == UserType.Admin);
        _;
    }
    
    modifier onlyMembersOrAdmins(uint256 teamUid) {
        Team storage team = createdTeams[teamUid];
        require(team.users[msg.sender] == UserType.Member || team.users[msg.sender] == UserType.Admin);
        _;
    }
    
    modifier onlyNotRegistered() {
        require (userTeamMap[msg.sender] == 0);
        _;
    }
    
    modifier onlySender(address userHash) {
        require (msg.sender == userHash);
        _;
    }

    function createTeam(string email, string teamName) public onlyNotRegistered returns (uint256){
        Team memory team = Team(teamCount, teamName, 0, 0);
        createdTeams[teamCount] = team;
        addToTeam(teamCount, msg.sender, email, UserType.Admin);
        teamCount++;
        return teamCount-1;
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
    
    function deployRoot(uint256 teamUid) public onlyAdmins(teamUid) {
        remoteBbFactory.deployRoot(teamUid, createdTeams[teamUid].admins[0].memberAddress);
    }
    
    function getTeamContractAddresses(uint256 teamUid) public view onlyMembersOrAdmins(teamUid) returns (address, address, address, address) {
        return remoteBbFactory.getTeamContractAddresses(teamUid);
    }
    
    function getTeamName(uint256 teamUid) public view returns (string){
        return createdTeams[teamUid].teamName;
    }
    
    function setTeamName(uint256 teamUid, string teamName) public onlyAdmins(teamUid){
        createdTeams[teamUid].teamName = teamName;
    }
    
    function toggleUserType(uint256 teamUid, address memberAddress) public onlyAdmins(teamUid){
        Team storage team = createdTeams[teamUid];
        UserType userType = team.users[memberAddress];
        string memory email;
        if (userType == UserType.Admin) {
            require(memberAddress != owner);
        }
        email = removeFromTeam(teamUid, memberAddress);
        addToTeam(teamUid, memberAddress, email, userType == UserType.Admin ? UserType.Member : UserType.Admin);
    }
    
    function inviteToTeam(uint256 teamUid, string email, UserType userType, uint256 expMilis) public onlyAdmins(teamUid){
        if (expMilis == 0) {
            expMilis = INVITATION_DURATION_IN_SECS;
        }
        require(userType == UserType.Admin || userType == UserType.Member);
        Team storage team = createdTeams[teamUid];
        team.invitedUsersEmail[email] = userType;
        invitedUserTeamMap[email] = InvitedUser(teamUid, now + expMilis);
    }

    function removeInvitationToTeam(uint256 teamUid, string email) public onlyAdmins(teamUid){
        removeInvitation(teamUid, email);
    }
    
    function isUserEmailInvited(string email) public view returns (bool) {
        return invitedUserTeamMap[email].teamUid != 0;
    }
    
    function getInvitedUserInfo(string email) public view returns (uint256, uint256, UserType) {
        InvitedUser storage invitedUser = invitedUserTeamMap[email];
        UserType userType = createdTeams[invitedUser.teamUid].invitedUsersEmail[email];
        return (invitedUser.teamUid, invitedUser.expirationTimestamp, userType);
    }
    
    function registerToTeam(address memberAddress, string email) public onlySender(memberAddress){
        uint256 teamUid = invitedUserTeamMap[email].teamUid;
        require(teamUid != 0);
        if (invitedUserTeamMap[email].expirationTimestamp > now) {
            addToTeam(teamUid, memberAddress, email, UserType.NotRegistered);
        } else {
            removeInvitation(teamUid, email);
        }
    }
    
    function getTeamMembers(uint256 teamUid) public view returns(address[], address[]) {
        uint adminsCount = createdTeams[teamUid].adminsCount;
        uint membersCount = createdTeams[teamUid].membersCount;
        address[] memory admins = new address[](adminsCount);
        address[] memory members = new address[](membersCount);
        for (uint i = 0; i < adminsCount; i++) {
            admins[i] = createdTeams[teamUid].admins[i].memberAddress;
        }
        for (uint j = 0; j < membersCount; j++) {
            members[j] = createdTeams[teamUid].members[j].memberAddress;
        }
        return (admins, members);
    }
    
    function getUserTeam(address memberAddress) public view returns(uint256) {
        return userTeamMap[memberAddress];
    }
    
    function getUserType(uint256 teamUid, address memberAddress) public view returns (UserType){
        return createdTeams[teamUid].users[memberAddress];
    }
    
    function getUserInfo(uint256 teamUid, address memberAddress) public view returns (uint256, UserType, string){
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
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function removeFromTeam(uint256 teamUid, address memberAddress) public onlyAdmins(teamUid) returns (string){
        require(memberAddress != owner);
        Team storage team = createdTeams[teamUid];
        uint256 userIndex;
        string memory email;
        UserType userType;
        (userIndex, userType, email) = getUserInfo(teamUid, memberAddress);
         if (userType == UserType.Admin) {
            delete team.admins[userIndex];
            team.adminsCount--;
        } else if (userType == UserType.Member) {
            delete team.members[userIndex];
            team.membersCount--;
        }
        delete team.users[memberAddress];
        delete userTeamMap[memberAddress];
        
        return email;
    }

    function removeInvitation(uint256 teamUid, string email) private{
        Team storage team = createdTeams[teamUid];
        delete team.invitedUsersEmail[email];
        delete invitedUserTeamMap[email];
    }
    
    function addToTeam(uint256 teamUid, address memberAddress, string email, UserType userType) private {
        Team storage team = createdTeams[teamUid];
        if (userType == UserType.NotRegistered) {
            userType = team.invitedUsersEmail[email];
            require(userType == UserType.Admin || userType == UserType.Member);
        }
        if (userType == UserType.Admin) {
            team.admins[team.adminsCount] = TeamMember(memberAddress, email);
            team.adminsCount++;
            team.users[memberAddress] = UserType.Admin;
        } else if (userType == UserType.Member) {
            team.members[team.membersCount] = TeamMember(memberAddress, email);
            team.membersCount++;
            team.users[memberAddress] = UserType.Member;
        }
        userTeamMap[memberAddress] = teamUid;
        delete team.invitedUsersEmail[email];
        delete invitedUserTeamMap[email];
    }
    
    function getUserIndexAndType(uint256 teamUid, address memberAddress)  private view returns (uint256, UserType){
        Team storage team = createdTeams[teamUid];
        UserType memberType = team.users[memberAddress];
        uint numberOfUsers = memberType == UserType.Admin ? team.adminsCount : team.membersCount;
        TeamMember memory auxMember;
        for (uint i = 0; i < numberOfUsers; i++) {
            if (memberType == UserType.Admin) {
                auxMember  = team.admins[i];
            } else if (memberType == UserType.Member) {
                auxMember  = team.members[i];
            }
            if (auxMember.memberAddress == memberAddress){
                return (i, memberType);
            }
        }
        return (0, UserType.NotRegistered);
    }
}
