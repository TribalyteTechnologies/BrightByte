pragma solidity 0.4.22;


contract CloudTeamManager {
    
    uint256 INVITATION_DURATION_IN_SECS = 1 * 60 * 60;
    
    mapping (uint256 => Team) private createdTeams;
    mapping (address => uint256) private userTeamMap;
    mapping (string => InvitedUser) private invitedUserTeamMap;
    
    uint256 private teamCount;
    address private owner;
    
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
        address memberHash;
        string email;
    }
    
    struct InvitedUser {
        uint256 teamUId;
        uint256 expirationTimestamp;
    }
    
    enum UserType { NotRegistered, Admin, Member }
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() public {
        owner = msg.sender;
        teamCount = 0;
        createTeam("root@bb.com", "Empty team");
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    modifier onlyAdmins(uint256 teamUId) {
        Team storage team = createdTeams[teamUId];
        require(team.users[msg.sender] == UserType.Admin);
        _;
    }
    
    modifier onlyNotRegistered() {
        require (userTeamMap[msg.sender] == 0);
        _;
    }

    function createTeam(string email, string teamName) public onlyNotRegistered returns (uint256){
        Team memory team = Team(teamCount, teamName, 0, 0);
        createdTeams[teamCount] = team;
        addToTeam(teamCount, msg.sender, email, UserType.Admin);
        teamCount++;
        return teamCount-1;
    }
    
    function getTeamName(uint256 teamUId) public view returns (string){
        return createdTeams[teamUId].teamName;
    }
    
    function setTeamName(uint256 teamUId, string teamName) public onlyAdmins(teamUId) returns (uint256){
        createdTeams[teamUId].teamName = teamName;
    }
    
    function changeUserType(uint256 teamUId, address memberHash) public onlyAdmins(teamUId){
        Team storage team = createdTeams[teamUId];
        UserType userType = team.users[memberHash];
        string memory email;
        if (userType == UserType.Admin) {
            require(msg.sender == owner);
            email = removeFromTeam(teamUId, memberHash);
            addToTeam(teamUId, memberHash, email, UserType.Member);
        } else if (userType == UserType.Member){
            email = removeFromTeam(teamUId, memberHash);
            addToTeam(teamUId, memberHash, email, UserType.Admin);
        }
    }
    
    function inviteToTeam(uint256 teamUId, string email, UserType userType) public onlyAdmins(teamUId){
        require(userType == UserType.Admin || userType == UserType.Member);
        Team storage team = createdTeams[teamUId];
        team.invitedUsersEmail[email] = userType;
        invitedUserTeamMap[email] = InvitedUser(teamUId, block.timestamp + INVITATION_DURATION_IN_SECS);
    }
    
    function isUserEmailInvited(string email) public view returns (bool) {
        return invitedUserTeamMap[email].teamUId != 0;
    }
    
    function registerToTeam(address memberHash, string email) public {
        uint256 teamUId = invitedUserTeamMap[email].teamUId;
        require(teamUId != 0);
        if (invitedUserTeamMap[email].expirationTimestamp >= block.timestamp) {
            addToTeam(teamUId, memberHash, email, UserType.NotRegistered);
        } else {
            Team storage team = createdTeams[teamUId];
            delete team.invitedUsersEmail[email];
            delete invitedUserTeamMap[email];
        }
    }
    
    function getTeamMembers(uint256 teamUId) public view returns(address[], address[]) {
        uint adminsCount = createdTeams[teamUId].adminsCount;
        uint membersCount = createdTeams[teamUId].membersCount;
        address[] memory admins = new address[](adminsCount);
        address[] memory members = new address[](membersCount);
        for (uint i = 0; i < adminsCount; i++) {
            admins[i] = createdTeams[teamUId].admins[i].memberHash;
        }
        for (uint j = 0; j < membersCount; j++) {
            members[j] = createdTeams[teamUId].members[j].memberHash;
        }
        return (admins, members);
    }
    
    function getUserTeam(address memberHash) public view returns(uint256) {
        return userTeamMap[memberHash];
    }
    
    function getUserType(uint256 teamUId, address memberHash) public view returns (UserType){
        return createdTeams[teamUId].users[memberHash];
    }
    
    function getUserInfo(uint256 teamUId, address memberHash) public view returns (uint256, UserType, string){
        Team storage team = createdTeams[teamUId];
        uint256 userIndex;
        UserType userType;
        (userIndex, userType) = getUserIndexAndType(teamUId, memberHash);
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
    
    function removeFromTeam(uint256 teamUId, address memberHash) public returns (string){
        Team storage team = createdTeams[teamUId];
        uint256 userIndex;
        string memory email;
        UserType userType;
        (userIndex, userType, email) = getUserInfo(teamUId, memberHash);
         if (userType == UserType.Admin) {
            delete team.admins[userIndex];
            team.adminsCount--;
        } else if (userType == UserType.Member) {
            delete team.members[userIndex];
            team.membersCount--;
        }
        delete team.users[memberHash];
        delete userTeamMap[memberHash];
        
        return email;
    }
    
    function addToTeam(uint256 teamUId, address memberHash, string email, UserType userType) private {
        Team storage team = createdTeams[teamUId];
        if (userType == UserType.NotRegistered) {
            userType = team.invitedUsersEmail[email];
            require(userType == UserType.Admin || userType == UserType.Member);
        }
        if (userType == UserType.Admin) {
            team.admins[team.adminsCount] = TeamMember(memberHash, email);
            team.adminsCount++;
            team.users[memberHash] = UserType.Admin;
        } else if (userType == UserType.Member) {
            team.members[team.membersCount] = TeamMember(memberHash, email);
            team.membersCount++;
            team.users[memberHash] = UserType.Member;
        }
        userTeamMap[memberHash] = teamUId;
        delete team.invitedUsersEmail[email];
        delete invitedUserTeamMap[email];
    }
    
    function getUserIndexAndType(uint256 teamUId, address memberHash)  private view returns (uint256, UserType){
        Team storage team = createdTeams[teamUId];
        UserType memberType = team.users[memberHash];
        uint numberOfUsers = memberType == UserType.Admin ? team.adminsCount : team.membersCount;
        TeamMember memory auxMember;
        for (uint i = 0; i < numberOfUsers; i++) {
            if (memberType == UserType.Admin) {
                auxMember  = team.admins[i];
            } else if (memberType == UserType.Member) {
                auxMember  = team.members[i];
            }
            if (auxMember.memberHash == memberHash){
                return (i, memberType);
            }
        }
        return (0, UserType.NotRegistered);
    }
}
