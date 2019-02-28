pragma solidity 0.4.21;
import "./Root.sol";

contract Bright {
    Root private root;
    uint constant finalDayMigrate = 1553122800;
    uint256 private constant seasonLengthSecs = 300000;
    uint256 private initialSeasonTimestamp;
    uint256 currentSeasonIndex;
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
        bytes32[] finishedCommits;
        bytes32[] pendingCommits;
        bytes32[] finishedReviews;
        bytes32[] pendingReviews;
        bytes32[] toRead;
        UserStats globalStats;
        mapping (uint256 => UserSeason) seasonData;
    }
    struct UserStats {
        uint256 reputation;
        uint256 numberOfPoints;
        uint256 numberOfTimesReview;
        uint256 agreedPercentage;
        uint256 positeVotes;
        uint256 negativeVotes;
        uint256 reviewsMade;
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

    function init(address _root) public {
        require(rootAddress == uint80(0));
        root = Root(_root);
        rootAddress = _root;
        currentSeasonIndex = 1;
        initialSeasonTimestamp = block.timestamp;
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

    function getUser (address userHash) public onlyDapp view returns (string, string, uint,uint, uint, uint, uint, uint) {
        UserProfile memory user = hashUserMap[userHash];
        return (user.name,
            user.email,
            user.finishedReviews.length,
            user.pendingReviews.length,
            user.finishedCommits.length,
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
        for (uint i = 0; i < hashUserMap[sender].pendingCommits.length; i++){
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
        bool tosaved = false;
        hashUserMap[user].toRead.push(url);
        for (uint i = 0; i < hashUserMap[sender].pendingCommits.length; i++){
            if(hashUserMap[sender].pendingCommits[i] == url){
                saved = true;
                break;
            }
        }
        if(!saved){
            uint j;
            for (i = 0; i < hashUserMap[sender].finishedCommits.length; i++){
                if(hashUserMap[sender].finishedCommits[i] == url){
                    j = i;
                    tosaved = true;
                    saved = true;
                    break;
                }
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
            if(tosaved){
                hashUserMap[sender].finishedCommits[j] = hashUserMap[sender].finishedCommits[hashUserMap[sender].finishedCommits.length-1];
                hashUserMap[sender].finishedCommits.length--;
                hashUserMap[sender].pendingCommits.push(url);
            }
            hashUserMap[user].pendingReviews.push(url);
        }
    }

    function getUserCommits(address add) public onlyDapp view returns(bytes32[], bytes32[], bytes32[], bytes32[]){
        UserProfile memory user = hashUserMap[add];
        return (user.pendingReviews,
                user.finishedReviews,
                user.pendingCommits,
                user.finishedCommits
        );
    }

    function getAllUserEmail(uint index) public onlyDapp view returns(string){
        return hashUserMap[allUsersArray[index]].email;
    }

    function getAllUserReputation(uint index) public onlyDapp view returns(string, uint,uint,uint,string, uint, uint, uint, address){
        UserProfile memory user = hashUserMap[allUsersArray[index]];
        return (user.email,
                user.globalStats.reputation,
                user.globalStats.numberOfTimesReview,
                user.globalStats.numberOfPoints,
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
        user.globalStats.reputation = root.calculateUserReputation(user.pendingCommits);
        
        UserProfile storage reviewer = hashUserMap[sender];
        for (uint j = 0 ; j < reviewer.pendingReviews.length; j++){
            if (url == reviewer.pendingReviews[j]){
                reviewer.pendingReviews[j] = reviewer.pendingReviews[reviewer.pendingReviews.length-1];
                reviewer.pendingReviews.length--;
                break;
            }
        }
        hashUserMap[sender].finishedReviews.push(url);
        if(userSeason.seasonCommits[url]) {
            userSeason.seasonStats.numberOfTimesReview++;
            userSeason.seasonStats.reputation = root.calculateUserReputation(userSeason.urlSeasonCommits);
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
            userMap.globalStats.agreedPercentage = (userMap.globalStats.positeVotes * 100) / (userMap.globalStats.positeVotes + userMap.globalStats.negativeVotes);
            if(hashUserMap[maker].seasonData[currentSeasonIndex].seasonCommits[url]) {
                setSeasonFeedback(user, vote);
            }
        }
        else{
            for (uint i = 0 ; i < userMap.toRead.length; i++){
                if (url == userMap.toRead[i]){
                    userMap.toRead[i] = userMap.toRead[userMap.toRead.length - 1];
                    userMap.toRead.length--;
                    break;
                }
            }
        }
    }

    function setSeasonFeedback(address user, uint8 vote) private {
        UserSeason storage season = hashUserMap[user].seasonData[currentSeasonIndex];
        if(vote == 1){
            season.seasonStats.positeVotes++;
        } else {
            season.seasonStats.negativeVotes++;
        }
        season.seasonStats.agreedPercentage = (season.seasonStats.positeVotes * 100) / 
        (season.seasonStats.positeVotes + season.seasonStats.negativeVotes);
    }

    function getToRead(address userHash) public onlyDapp view returns (bytes32[]) {
        return (hashUserMap[userHash].toRead);
    }

    function getVotes(address userHash, bool global, uint256 indSeason) public onlyDapp view returns (uint, uint) {
        if(global) {
            return (hashUserMap[userHash].globalStats.positeVotes, hashUserMap[userHash].globalStats.negativeVotes);
        } else {
            return (hashUserMap[userHash].seasonData[indSeason].seasonStats.positeVotes, hashUserMap[userHash].seasonData[indSeason].seasonStats.negativeVotes);
        }
        
    }

    function getUserReputation(uint ind,uint sea) public onlyDapp view returns(string, uint, uint, uint, string, uint, uint, uint, address) {
        UserProfile memory user = hashUserMap[allUsersArray[ind]];
        UserSeason memory season = hashUserMap[allUsersArray[ind]].seasonData[sea];
        return(user.email,
            season.seasonStats.reputation,
            season.seasonStats.numberOfTimesReview,
            season.seasonStats.numberOfPoints,
            user.name,
            season.seasonStats.agreedPercentage,
            season.urlSeasonCommits.length,
            season.seasonStats.reviewsMade,
            user.hash
        );
    }

    function getCurrentSeason() public onlyDapp view returns (uint256, uint256) {
        return (currentSeasonIndex, (initialSeasonTimestamp + (currentSeasonIndex * seasonLengthSecs)));
    }

    function getSeasonCommits(uint ind, uint sea) public onlyDapp view returns(bytes32[]){
        UserSeason memory season = hashUserMap[allUsersArray[ind]].seasonData[sea];
        return(season.urlSeasonCommits);
    }

    function checkSeason() private {
        uint256 seasonFinale = initialSeasonTimestamp + (currentSeasonIndex * seasonLengthSecs);
        if(block.timestamp > seasonFinale) {
            currentSeasonIndex++;
        }
    }

    function setAllUserData(string name, string mail, address hash, uint perct, uint pts, uint tmRw, uint pos, uint256 neg, uint rep, uint rev) public onlyDapp {
        require (bytes(hashUserMap[hash].name).length == 0 && bytes(hashUserMap[hash].email).length == 0 && block.timestamp < finalDayMigrate);
        UserProfile storage user = hashUserMap[hash];
        user.name = name;
        user.email = mail;
        user.hash = hash;
        user.globalStats.agreedPercentage = perct;
        user.globalStats.numberOfPoints = pts;
        user.globalStats.numberOfTimesReview = tmRw;
        user.globalStats.positeVotes = pos;
        user.globalStats.negativeVotes = neg;
        user.globalStats.reputation = rep;
        user.globalStats.reviewsMade = rev;
        bytes32 emailId = keccak256(mail);
        emailUserMap[emailId] = hash;
        allUsersArray.push(hash);
    }

    function setAllUserSeasonData(uint sea, address userAddr, uint perct, uint pts, uint tmRw, uint pos, uint256 neg, uint rep, uint rev) public onlyDapp {
        UserProfile storage user = hashUserMap[userAddr];
        UserSeason storage season = user.seasonData[sea];
        season.seasonStats.numberOfPoints = pts;
        season.seasonStats.numberOfTimesReview = tmRw;
        season.seasonStats.agreedPercentage = perct;
        season.seasonStats.positeVotes = pos;
        season.seasonStats.negativeVotes = neg;
        season.seasonStats.reputation = rep;
        season.seasonStats.reviewsMade = rev;
    }

    function setAllUserSeasonUrl(uint sea, address userAddr, bytes32 url) public onlyDapp {
        UserProfile storage user = hashUserMap[userAddr];
        UserSeason storage season = user.seasonData[sea];
        season.seasonCommits[url] = true;
        season.urlSeasonCommits.push(url);
    }

    function setAllUserDataTwo(address h, bytes32[] finCom, bytes32[] pendCom,  bytes32[] finRev, bytes32[] pendRev, bytes32[] toRd) public onlyDapp { 
        require (block.timestamp < finalDayMigrate);
        UserProfile storage user = hashUserMap[h];
        for(uint i = 0; i < finCom.length; i++) {
            user.finishedCommits.push(finCom[i]);
        }
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
}
