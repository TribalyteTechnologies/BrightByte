pragma solidity 0.4.21;
import "./Root.sol";

contract Bright {
    uint8 private constant FEEDBACK_MULTIPLER = 100;
    uint24 private constant SEASON_LENGTH_SECS = 90 * 24 * 60 * 60;
    uint32 private constant MIGRATION_END_TIMESTAMP = 1557824126;
    Root private root;
    uint16 private currentSeasonIndex;
    uint256 private initialSeasonTimestamp;
    event UserProfileSetEvent (string name, address hash);
    mapping (address => UserProfile) private hashUserMap;
    mapping (bytes32 => address) private emailUserMap;
    address[] private allUsersArray;

    address private rootAddress;
    address private owner;

    struct UserProfile {
        string name;
        string email;
        address hash;
        bytes32[] pendingCommits;
        bytes32[] finishedReviews;
        bytes32[] pendingReviews;
        bytes32[] toRead;
        UserStats globalStats;
        mapping (uint16 => UserSeason) seasonData;
    }
    struct UserStats {
        uint32 reputation;
        uint32 cumulativeComplexity;
        uint16 numberOfTimesReview;
        uint16 agreedPercentage;
        uint16 positeVotes;
        uint16 negativeVotes;
        uint16 reviewsMade;
    }
    struct UserSeason {
        UserStats seasonStats;
        mapping (bytes32 => bool) seasonCommits;
        bytes32[] urlSeasonCommits;
    }
   
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function Bright() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyRoot() {
        require(msg.sender == rootAddress);
        _;
    }

    modifier onlyDapp() {
        require (msg.sender == rootAddress || msg.sender == tx.origin);
        _;
    }

    function init(address _root, uint16 seasonIndex, uint256 initialTimestamp) public {
        require(rootAddress == uint80(0));
        root = Root(_root);
        rootAddress = _root;
        currentSeasonIndex = seasonIndex;
        initialSeasonTimestamp = initialTimestamp;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setRootAddress(address a) public onlyOwner {
        rootAddress = a;
    }

    function setProfile (string name, string email) public onlyDapp {
        address user = tx.origin;
        bytes32 emailId = keccak256(email);
        if (bytes(hashUserMap[user].name).length == 0 && bytes(hashUserMap[user].email).length == 0){
            UserProfile storage newUser = hashUserMap[user];
            newUser.name = name;
            newUser.email = email;
            newUser.hash = user;
            emailUserMap[emailId] = user;
            allUsersArray.push(user);
        } else {
            bytes32 userEmail = keccak256(hashUserMap[user].email);
            if(emailId == userEmail) {
                require(emailUserMap[emailId] == address(0));
                delete emailUserMap[userEmail];
                hashUserMap[user].email = email;
                emailUserMap[emailId] = user;
            }
            hashUserMap[user].name = name;
        }
        emit UserProfileSetEvent(name, user);
    }

    function getUser (address userHash) public onlyDapp view returns (string, string, uint, uint, uint, uint32, uint16) {
        UserProfile memory user = hashUserMap[userHash];
        return (user.name,
            user.email,
            user.finishedReviews.length,
            user.pendingReviews.length,
            user.pendingCommits.length,
            user.globalStats.reputation,
            user.globalStats.agreedPercentage
        );
    }

    function getAddressByEmail(bytes32 email) public onlyDapp view returns(address){
        address a = emailUserMap[email];
        return a;
    }

    function setCommit(bytes32 url) public onlyRoot {
        address sender = tx.origin;
        bool saved = false;
        for (uint16 i = 0; i < hashUserMap[sender].pendingCommits.length; i++){
            if(hashUserMap[sender].pendingCommits[i] == url){
                saved = true;
                break;
            }
        }
        if(!saved){
            UserProfile storage user = hashUserMap[sender];
            user.pendingCommits.push(url);
            checkSeason();
            user.seasonData[currentSeasonIndex].urlSeasonCommits.push(url);
            user.seasonData[currentSeasonIndex].seasonCommits[url] = true;
            
        }
    }

    function notifyCommit (string a, bytes32 email) public onlyRoot {
        bytes32 url = keccak256(a);
        address sender = tx.origin;
        address user = getAddressByEmail(email);
        require(user != address(0));
        bool saved = false;
        hashUserMap[user].toRead.push(url);
        for (uint16 i = 0; i < hashUserMap[sender].pendingCommits.length; i++){
            if(hashUserMap[sender].pendingCommits[i] == url){
                saved = true;
                break;
            }
        }
        bool done = false;
        for (i = 0; i < hashUserMap[user].pendingReviews.length; i++){
            if(hashUserMap[user].pendingReviews[i] == url){
                done = true;
                break;
            }
        }
        if (!done && saved){
            hashUserMap[user].pendingReviews.push(url);
        }
    }

    function getUserCommits(address add) public onlyDapp view returns(bytes32[], bytes32[], bytes32[]){
        UserProfile memory user = hashUserMap[add];
        return (user.pendingReviews,
                user.finishedReviews,
                user.pendingCommits
        );
    }

    function getAllUserEmail(uint index) public onlyDapp view returns(string){
        return hashUserMap[allUsersArray[index]].email;
    }

    function getAllUserReputation(uint index) public onlyDapp view returns(string, uint32, uint16, string, uint16, uint, uint, address) {
        UserProfile memory user = hashUserMap[allUsersArray[index]];
        return (user.email,
                user.globalStats.reputation,
                user.globalStats.numberOfTimesReview,
                user.name,
                user.globalStats.agreedPercentage,
                user.pendingCommits.length,
                user.finishedReviews.length,
                user.hash
        );
    }

    function getNumbers() public onlyDapp view returns(uint){
        return allUsersArray.length;
    }

    function setReview(bytes32 url,address author) public onlyRoot {
        address sender = tx.origin;
        require(hashUserMap[author].hash == author && hashUserMap[sender].hash == sender);
        checkSeason();
        UserProfile storage user = hashUserMap[author];
        UserSeason storage userSeason = user.seasonData[currentSeasonIndex];

        user.globalStats.numberOfTimesReview ++;
        
        UserProfile storage reviewer = hashUserMap[sender];
        for (uint8 j = 0 ; j < reviewer.pendingReviews.length; j++){
            if (url == reviewer.pendingReviews[j]){
                reviewer.pendingReviews[j] = reviewer.pendingReviews[reviewer.pendingReviews.length-1];
                reviewer.pendingReviews.length--;
                break;
            }
        }
        hashUserMap[sender].finishedReviews.push(url);
        if(userSeason.seasonCommits[url]) {
            userSeason.seasonStats.numberOfTimesReview++;
            (userSeason.seasonStats.reputation, userSeason.seasonStats.cumulativeComplexity) = root.calculateUserReputation(url, userSeason.seasonStats.reputation, userSeason.seasonStats.cumulativeComplexity);
            reviewer.seasonData[currentSeasonIndex].seasonStats.reviewsMade++;
        }
    }

    function getUserName(address userHash) public onlyDapp view returns (string) {
        return (hashUserMap[userHash].name);
    }

    function getFeedback(bytes32 url) public onlyDapp view returns (bool){
        address sender = tx.origin;
        bool read = false;
        for (uint i = 0; i<hashUserMap[sender].toRead.length; i++){
            if(hashUserMap[sender].toRead[i] == url){
                read = true;
            }
        }
        return read;
    }

    function setFeedback(bytes32 url, address user, bool value, uint8 vote) public onlyRoot{
        address sender = user;
        address maker = tx.origin;
        UserProfile storage userMap = hashUserMap[sender];
        checkSeason();
        if(value){
            hashUserMap[maker].seasonData[currentSeasonIndex].seasonCommits[url];
            userMap.toRead.push(url);
            if(vote == 1) {
                userMap.globalStats.positeVotes++;
            }
            else if (vote == 2){
                userMap.globalStats.negativeVotes++;
            }
            userMap.globalStats.agreedPercentage = (userMap.globalStats.positeVotes * FEEDBACK_MULTIPLER) / (userMap.globalStats.positeVotes + userMap.globalStats.negativeVotes);
            if(hashUserMap[maker].seasonData[currentSeasonIndex].seasonCommits[url]) {
                setSeasonFeedback(user, vote);
            }
        }
        else{
            for (uint16 i = 0 ; i < userMap.toRead.length; i++){
                if (url == userMap.toRead[i]){
                    userMap.toRead[i] = userMap.toRead[userMap.toRead.length - 1];
                    userMap.toRead.length--;
                    break;
                }
            }
        }
    }

    function setSeasonFeedback(address user, uint8 vote) private {
        UserStats storage season = hashUserMap[user].seasonData[currentSeasonIndex].seasonStats;
        if(vote == 1){
            season.positeVotes++;
        } else {
            season.negativeVotes++;
        }
        season.agreedPercentage = (season.positeVotes * FEEDBACK_MULTIPLER) / (season.positeVotes + season.negativeVotes);
    }

    function getToRead(address userHash) public onlyDapp view returns (bytes32[]) {
        return (hashUserMap[userHash].toRead);
    }

    function getVotes(address userHash, bool global, uint16 indSeason) public onlyDapp view returns (uint, uint) {
        if(global) {
            return (hashUserMap[userHash].globalStats.positeVotes, hashUserMap[userHash].globalStats.negativeVotes);
        } else {
            return (hashUserMap[userHash].seasonData[indSeason].seasonStats.positeVotes, hashUserMap[userHash].seasonData[indSeason].seasonStats.negativeVotes);
        }
    }

    function getUserReputation(uint ind, uint16 sea) public onlyDapp view returns(string, uint32, uint16, string, uint16, uint, uint16, address) {
        UserProfile memory user = hashUserMap[allUsersArray[ind]];
        UserSeason memory season = hashUserMap[allUsersArray[ind]].seasonData[sea];
        return(user.email,
            season.seasonStats.reputation,
            season.seasonStats.numberOfTimesReview,
            user.name,
            season.seasonStats.agreedPercentage,
            season.urlSeasonCommits.length,
            season.seasonStats.reviewsMade,
            user.hash
        );
    }

    function getCurrentSeason() public onlyDapp view returns (uint16, uint256) {
        return (currentSeasonIndex, (initialSeasonTimestamp + (currentSeasonIndex * SEASON_LENGTH_SECS)));
    }

    function getAllUserSeasonUrls(uint16 seasonIndex, address userAddr) public onlyDapp view returns (bytes32[]) {
        UserSeason memory season = hashUserMap[userAddr].seasonData[seasonIndex];
        return season.urlSeasonCommits;
    }

    function checkSeason() private {
        uint256 seasonFinale = initialSeasonTimestamp + (currentSeasonIndex * SEASON_LENGTH_SECS);
        if(block.timestamp > seasonFinale) {
            currentSeasonIndex++;
        }
    }

    function setAllUserData(string name, string mail, address hash, uint16 perct, uint16 tmRw, uint16 pos, uint16 neg, uint32 rep, uint16 rev) public onlyDapp {
        require (bytes(hashUserMap[hash].name).length == 0 && bytes(hashUserMap[hash].email).length == 0 && block.timestamp < MIGRATION_END_TIMESTAMP);
        UserProfile storage user = hashUserMap[hash];
        user.name = name;
        user.email = mail;
        user.hash = hash;
        user.globalStats.agreedPercentage = perct;
        user.globalStats.numberOfTimesReview = tmRw;
        user.globalStats.positeVotes = pos;
        user.globalStats.negativeVotes = neg;
        user.globalStats.reputation = rep;
        user.globalStats.reviewsMade = rev;
        bytes32 emailId = keccak256(mail);
        emailUserMap[emailId] = hash;
        allUsersArray.push(hash);
    }

    function setAllUserSeasonData(uint8 sea, address userAddr, uint16 perct, uint16 tmRw, uint16 pos, uint16 neg, uint32 rep, uint16 rev) public onlyDapp {
        UserProfile storage user = hashUserMap[userAddr];
        UserSeason storage season = user.seasonData[sea];
        season.seasonStats.numberOfTimesReview = tmRw;
        season.seasonStats.agreedPercentage = perct;
        season.seasonStats.positeVotes = pos;
        season.seasonStats.negativeVotes = neg;
        season.seasonStats.reputation = rep;
        season.seasonStats.reviewsMade = rev;
    }

    function setAllUserDataTwo(address h, bytes32[] pendCom,  bytes32[] finRev, bytes32[] pendRev, bytes32[] toRd) public onlyDapp { 
        require (block.timestamp < MIGRATION_END_TIMESTAMP);
        UserProfile storage user = hashUserMap[h];
        for(uint j = 0; j < pendCom.length; j++) {
            user.pendingCommits.push(pendCom[j]);
        }
        for(uint x = 0; x < finRev.length; x++) {
            user.finishedReviews.push(finRev[x]);
        }
        for(uint y = 0; y < pendRev.length; y++) {
            user.pendingReviews.push(pendRev[y]);
        }
        for(uint m = 0; m < toRd.length; m++) {
            user.toRead.push(toRd[m]);
        }
    }

    function setUrlsSeason(uint16 seasonIndex, address userAddr, bytes32[] urls) public onlyDapp {
        require (block.timestamp < MIGRATION_END_TIMESTAMP);
        UserProfile storage user = hashUserMap[userAddr];
        UserSeason storage season = user.seasonData[seasonIndex];
        for(uint16 i = 0; i < urls.length; i++) {
            season.seasonCommits[urls[i]] = true;
            season.urlSeasonCommits.push(urls[i]);
        }
    }

    function checkCommitSeason(bytes32 url,address author) public onlyRoot view returns (bool) {
        return hashUserMap[author].seasonData[currentSeasonIndex].seasonCommits[url];
    }
}
