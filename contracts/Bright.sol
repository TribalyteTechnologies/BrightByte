pragma solidity 0.4.21;
import "./Root.sol";

contract Bright {
    Root private root;
    uint constant finalDayMigrate = 1551103200;
    uint256 private constant seasonLength = 7776000;
    uint256 currentSeason;
    event UserProfileSetEvent (string name, address hash);
    mapping (address => UserProfile) private hashUserMap;
    mapping (bytes32 => address) private emailUserMap;
    mapping (uint256 => uint256) private seasonsEnd;
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
        uint256 reputation;
        uint256 agreedPercentage;
        uint256 numberOfPoints;
        uint256 numberOfTimesReview;
        uint256 positeVotes;
        uint256 negativeVotes;
        bytes32[] toRead;
        mapping (uint256 => UserSeason) seasonsDetails;
    }
    struct UserSeason {
        uint256 reputation;
        uint256 numberOfPoints;
        uint256 numberOfTimesReview;
        uint256 agreedPercentage;
        uint256 positeVotes;
        uint256 negativeVotes;
        uint256 reviewsMade;
        mapping (bytes32 => bool) seasonCommits; //Guarda la ur del commit y como valor tiene si está pending o no
        bytes32[] urlSeasonCommits; //todos los commits de esa temporada
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
        currentSeason = 1;
        seasonsEnd[currentSeason] = block.timestamp + seasonLength;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setRootAddress(address a) public onlyOwner {
        rootAddress = a;
    }

    function setProfile (string _name, string _email) public onlyDapp {
        address user = tx.origin;
        if (bytes(hashUserMap[user].name).length == 0 && bytes(hashUserMap[user].email).length == 0){
            UserProfile storage newUser = hashUserMap[user];
            newUser.name = _name;
            newUser.email = _email;
            newUser.hash = user;
            newUser.agreedPercentage = 100;
            newUser.seasonsDetails[currentSeason].agreedPercentage = 100;
            bytes32 emailId = keccak256(_email);
            emailUserMap[emailId] = user;
            allUsersArray.push(user);
        } else {
            if (keccak256(_email) != keccak256(hashUserMap[user].email)){
                require(emailUserMap[keccak256(_email)] == address(0));
                delete emailUserMap[keccak256(hashUserMap[user].email)];
                hashUserMap[user].email = _email;
                emailUserMap[keccak256(_email)] = user;
            }
            hashUserMap[user].name = _name;
        }
        emit UserProfileSetEvent(_name, user);
    }

    function getUser (address _hash) public onlyDapp view returns (string, string, uint,uint, uint, uint, uint, uint) {
        UserProfile memory user = hashUserMap[_hash];
        return (user.name,
            user.email,
            user.finishedReviews.length,
            user.pendingReviews.length,
            user.finishedCommits.length,
            user.pendingCommits.length,
            user.reputation,
            user.agreedPercentage
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
            }
        }
        if(!saved){
            UserProfile storage user = hashUserMap[sender];
            user.pendingCommits.push(url);
            checkSeason();
            user.seasonsDetails[currentSeason].urlSeasonCommits.push(url);
            user.seasonsDetails[currentSeason].seasonCommits[url] = true;
            
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

    function getUserCommits(address _a) public onlyDapp view returns(bytes32[], bytes32[], bytes32[], bytes32[]){
        UserProfile memory user = hashUserMap[_a];
        return (user.pendingReviews,
                user.finishedReviews,
                user.pendingCommits,
                user.finishedCommits
        );
    }

    function getAllUserEmail(uint _index) public onlyDapp view returns(string){
        return hashUserMap[allUsersArray[_index]].email;
    }

    function getAllUserReputation(uint _index) public onlyDapp view returns(string, uint,uint,uint,string, uint, uint, uint, address){
        UserProfile memory user = hashUserMap[allUsersArray[_index]];
        return (user.email,
                user.reputation,
                user.numberOfTimesReview,
                user.numberOfPoints,
                user.name,
                user.agreedPercentage,
                user.pendingCommits.length,
                user.finishedReviews.length,
                user.hash
        );
    }

    function getNumbers() public onlyDapp view returns(uint){
        return allUsersArray.length;
    }

    function setReview(bytes32 url,address author, uint256 _points) public onlyRoot {
        address sender = tx.origin;
        require(hashUserMap[author].hash == author && hashUserMap[sender].hash == sender);
        checkSeason();
        UserProfile storage user = hashUserMap[author];
        UserSeason storage userSeason = user.seasonsDetails[currentSeason];

        uint256 value = user.numberOfPoints + _points;
        user.numberOfTimesReview ++;
        user.numberOfPoints = value;
        user.reputation = value/user.numberOfTimesReview;

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
            uint256 seasonValue = userSeason.numberOfPoints + _points;
            userSeason.numberOfTimesReview++;
            userSeason.numberOfPoints = seasonValue;
            userSeason.reputation = seasonValue/userSeason.numberOfTimesReview;
            reviewer.seasonsDetails[currentSeason].reviewsMade++;
        }
    }

    function getUserName(address _hash) public onlyDapp view returns (string) {
        return (hashUserMap[_hash].name);
    }

    function getFeedback(bytes32 _url) public onlyDapp view returns (bool){
        address sender = tx.origin;
        bool read = false;
        for (uint i = 0; i<hashUserMap[sender].toRead.length; i++){
            if(hashUserMap[sender].toRead[i] == _url){
                read = true;
            }
        }
        return read;
    }

    function setFeedback(bytes32 _url, address user, bool value, uint8 vote) public onlyRoot{
        address sender = user;
        address maker = tx.origin;
        UserProfile storage userMap = hashUserMap[sender];
        UserSeason storage season = hashUserMap[sender].seasonsDetails[currentSeason];
        checkSeason();
        if(value){
            bool actualSeason = hashUserMap[maker].seasonsDetails[currentSeason].seasonCommits[_url];
            userMap.toRead.push(_url);
            if(vote == 1) {
                userMap.positeVotes++;
                if(actualSeason) {
                    season.positeVotes++;
                }
            }
            else if (vote == 2){
                userMap.negativeVotes++;
                if(actualSeason) {
                    season.negativeVotes++;
                }
            }
            userMap.agreedPercentage = (userMap.positeVotes * 100) / (userMap.positeVotes + userMap.negativeVotes);
            if(actualSeason) {
                season.agreedPercentage = (season.positeVotes * 100) / (season.positeVotes + season.negativeVotes);
            }
        }
        else{
            for (uint i = 0 ; i < userMap.toRead.length; i++){
                if (_url == userMap.toRead[i]){
                    userMap.toRead[i] = userMap.toRead[userMap.toRead.length - 1];
                    userMap.toRead.length--;
                    break;
                }
            }
        }
    }

    function getToRead(address _hash) public onlyDapp view returns (bytes32[]) {
        return (hashUserMap[_hash].toRead);
    }

    function getVotes(address _hash) public onlyDapp view returns (uint, uint) {
        return (hashUserMap[_hash].positeVotes, hashUserMap[_hash].negativeVotes);
    }

    function getUserSeasonReputation(uint256 _index, uint256 _season) public onlyDapp view returns(string, uint, uint, uint, string, uint, uint, uint, address) {
        checkSeason();
        UserProfile memory user = hashUserMap[allUsersArray[_index]];
        UserSeason memory season = hashUserMap[allUsersArray[_index]].seasonsDetails[_season];
        return (user.email,
            season.reputation,
            season.numberOfTimesReview,
            season.numberOfPoints,
            user.name,
            season.agreedPercentage,
            season.urlSeasonCommits.length,
            season.reviewsMade,
            user.hash
        );
    }

    function getCurrentSeason() public onlyDapp view returns (uint256, uint256) {
        return (currentSeason, (seasonsEnd[currentSeason] - block.timestamp));
    }

    function checkSeason() private {
        if(block.timestamp > seasonsEnd[currentSeason]) { //Cambiar 
            currentSeason++;
            seasonsEnd[currentSeason] = seasonsEnd[currentSeason - 1] + seasonLength;
            for(uint i = 0; i < allUsersArray.length; i++){
                hashUserMap[allUsersArray[i]].seasonsDetails[currentSeason].agreedPercentage = 100;
            }
        }
    }

    function setAllUserData(string name, string mail, address hash, uint perct, uint pts, uint tmRw, uint pos, uint256 neg, uint rep) public onlyDapp {
        require (bytes(hashUserMap[hash].name).length == 0 && bytes(hashUserMap[hash].email).length == 0 && block.timestamp < finalDayMigrate);
        UserProfile storage user = hashUserMap[hash];
        user.name = name;
        user.email = mail;
        user.hash = hash;
        user.agreedPercentage = perct;
        user.numberOfPoints = pts;
        user.numberOfTimesReview = tmRw;
        user.positeVotes = pos;
        user.negativeVotes = neg;
        user.reputation = rep;
        UserSeason storage season = user.seasonsDetails[0];
        season.numberOfPoints = pts;
        season.numberOfTimesReview = tmRw;
        season.agreedPercentage = perct;
        season.positeVotes = pos;
        season.negativeVotes = neg;
        season.reputation = rep;
        bytes32 emailId = keccak256(mail);
        emailUserMap[emailId] = hash;
        allUsersArray.push(hash);
    }

    function setAllUserDataTwo(address h, bytes32[] finCom, bytes32[] pendCom,  bytes32[] finRev, bytes32[] pendRev, bytes32[] toRd) public onlyDapp { 
        require (block.timestamp < finalDayMigrate);
        UserProfile storage user = hashUserMap[h];
        UserSeason storage season = user.seasonsDetails[0];
        for(uint i = 0; i < finCom.length; i++) {
            user.finishedCommits.push(finCom[i]);
        }
        for(uint j = 0; j < pendCom.length; j++) {
            user.pendingCommits.push(pendCom[j]);
            season.urlSeasonCommits.push(pendCom[j]);
            season.seasonCommits[pendCom[j]] = true;
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
        season.reviewsMade = finRev.length;
    }
}
