pragma solidity 0.4.21;
import "./Root.sol";

contract Bright {
    Root private root;
    uint constant finalDayMigrate = 1548028800;
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
        uint256 reputation;
        uint256 agreedPercentage;
        uint256 numberOfPoints;
        uint256 numberOfTimesReview;
        uint256 positeVotes;
        uint256 negativeVotes;
        bytes32[] toRead;
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
            newUser.numberOfTimesReview = 0;
            newUser.agreedPercentage = 100;
            newUser.positeVotes = 0;
            newUser.negativeVotes = 0;
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
            hashUserMap[sender].pendingCommits.push(url);
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
        if (msg.sender != owner) {
            _a = tx.origin;
        }
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

    function getAllUserReputation(uint _index) public onlyDapp view returns(string, uint,uint,uint,string, uint, uint, uint){
        UserProfile memory user = hashUserMap[allUsersArray[_index]];
        return (user.email,
                user.reputation,
                user.numberOfTimesReview,
                user.numberOfPoints,
                user.name,
                user.agreedPercentage,
                user.pendingCommits.length,
                user.finishedReviews.length
        );
    }

    function getNumbers() public onlyDapp view returns(uint){
        return allUsersArray.length;
    }

    function setReview(bytes32 url,address author, uint256 _points) public onlyRoot {
        address sender = tx.origin;
        require(hashUserMap[author].hash == author && hashUserMap[sender].hash == sender);
        
        uint value = hashUserMap[author].numberOfPoints + _points;
        hashUserMap[author].numberOfTimesReview ++;
        hashUserMap[author].numberOfPoints = value;
        hashUserMap[author].reputation = value/hashUserMap[author].numberOfTimesReview;

        for (uint j = 0 ; j < hashUserMap[sender].pendingReviews.length; j++){
            if (url == hashUserMap[sender].pendingReviews[j]){
                hashUserMap[sender].pendingReviews[j] = hashUserMap[sender].pendingReviews[hashUserMap[sender].pendingReviews.length-1];
                hashUserMap[sender].pendingReviews.length--;
                break;
            }
        }
        hashUserMap[sender].finishedReviews.push(url);
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
        UserProfile storage userMap = hashUserMap[sender];
        if(value){
            userMap.toRead.push(_url);
            if(vote == 1) {
                userMap.positeVotes++;
            }
            else if (vote == 2){
                userMap.negativeVotes++;
            }
            userMap.agreedPercentage = (userMap.positeVotes * 100) / (userMap.positeVotes + userMap.negativeVotes);
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
        bytes32 emailId = keccak256(mail);
        emailUserMap[emailId] = hash;
        allUsersArray.push(hash);
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
