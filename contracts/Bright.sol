pragma solidity 0.4.21;

contract Bright {

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
        uint256 numberOfPoints;
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

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
<<<<<<< HEAD
    function setRootAddress(address a) onlyOwner public {
        rootAddress = a;
    }

    function setProfile (string _name, string _email) onlyDapp public {
=======
    function setRootAddress(address a) public onlyOwner {
        rootAddress = a;
    }

    function setProfile (string _name, string _email) public onlyDapp {
>>>>>>> origin/dev_arr

        address user = tx.origin;
        //require(_hash == msg.sender);
        if (bytes(hashUserMap[user].name).length == 0 && bytes(hashUserMap[user].email).length == 0){
            hashUserMap[user].name = _name;
            hashUserMap[user].email = _email;
            hashUserMap[user].hash = user;
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

<<<<<<< HEAD
    function getUser (address _hash) onlyDapp public view returns (string, string, uint,uint, uint, uint, uint) {
=======
    function getUser (address _hash) public onlyDapp view returns (string, string, uint,uint, uint, uint, uint) {
>>>>>>> origin/dev_arr
        return (hashUserMap[_hash].name,
            hashUserMap[_hash].email,
            hashUserMap[_hash].finishedReviews.length,
            hashUserMap[_hash].pendingReviews.length,
            hashUserMap[_hash].finishedCommits.length,
            hashUserMap[_hash].pendingCommits.length,
            hashUserMap[_hash].reputation
        );
    }
<<<<<<< HEAD
    function getAddressByEmail(bytes32 email) onlyDapp public view returns(address){
        address a = emailUserMap[email];
        return a;
    }
    function setCommit(bytes32 url) onlyRoot public{
=======
    function getAddressByEmail(bytes32 email) public onlyDapp view returns(address){
        address a = emailUserMap[email];
        return a;
    }
    function setCommit(bytes32 url) public onlyRoot {
>>>>>>> origin/dev_arr
        address sender = tx.origin;
        bool saved = false;
        for (uint i = 0; i<hashUserMap[sender].pendingCommits.length;i++){
            if(hashUserMap[sender].pendingCommits[i] == url){
                saved = true;
            }
        }
        if(!saved){
            hashUserMap[sender].pendingCommits.push(url);
        }
    }
<<<<<<< HEAD
    function notifyCommit (string a, bytes32 email) onlyRoot public {
        bytes32 url = keccak256(a);
        address sender = tx.origin;
        address user = getAddressByEmail(email);
        require (user != address(0));
        bool saved = false;
        bool tosaved=false;
=======
    function notifyCommit (string a, bytes32 email) public onlyRoot {
        bytes32 url = keccak256(a);
        address sender = tx.origin;
        address user = getAddressByEmail(email);
        require(user != address(0));
        bool saved = false;
        bool tosaved = false;
>>>>>>> origin/dev_arr
        for (uint i = 0; i<hashUserMap[sender].pendingCommits.length;i++){
            if(hashUserMap[sender].pendingCommits[i] == url){
                saved = true;
                break;
            }
        }
        if(!saved){
            uint j;
            for (i = 0; i<hashUserMap[sender].finishedCommits.length;i++){
                if(hashUserMap[sender].finishedCommits[i] == url){
<<<<<<< HEAD
                    j=i;
                    tosaved = true;
                    saved=true;
=======
                    j = i;
                    tosaved = true;
                    saved = true;
>>>>>>> origin/dev_arr
                    break;
                }
            }
        }
        bool done = false;
        for (i = 0; i<hashUserMap[user].pendingReviews.length;i++){
            if(hashUserMap[user].pendingReviews[i] == url){
                done = true;
                break;
            }
        }
        if (!done && saved){
            if(tosaved){
<<<<<<< HEAD
                hashUserMap[sender].finishedCommits[j]=hashUserMap[sender].finishedCommits[hashUserMap[sender].finishedCommits.length-1];
=======
                hashUserMap[sender].finishedCommits[j] = hashUserMap[sender].finishedCommits[hashUserMap[sender].finishedCommits.length-1];
>>>>>>> origin/dev_arr
                hashUserMap[sender].finishedCommits.length--;
                hashUserMap[sender].pendingCommits.push(url);
            }
            hashUserMap[user].pendingReviews.push(url);
        }
    }
<<<<<<< HEAD
    function getUserCommits(address a) onlyDapp public view returns(bytes32[],bytes32[],bytes32[],bytes32[]){
        if (msg.sender != owner) {
            a = tx.origin;
        }
        return (hashUserMap[a].pendingReviews, hashUserMap[a].finishedReviews, hashUserMap[a].pendingCommits, hashUserMap[a].finishedCommits);
    }
    function getAllUserEmail(uint _index) onlyDapp public view returns(string){
        return hashUserMap[allUsersArray[_index]].email;
    }
    function getAllUserReputation(uint _index) onlyDapp public view returns(string, uint,uint){
=======
    function getUserCommits(address _a) public onlyDapp view returns(bytes32[], bytes32[], bytes32[], bytes32[]){
        if (msg.sender != owner) {
            _a = tx.origin;
        }
        return (hashUserMap[_a].pendingReviews,
                hashUserMap[_a].finishedReviews,
                hashUserMap[_a].pendingCommits,
                hashUserMap[_a].finishedCommits
        );
    }
    function getAllUserEmail(uint _index) public onlyDapp view returns(string){
        return hashUserMap[allUsersArray[_index]].email;
    }
    function getAllUserReputation(uint _index) public onlyDapp view returns(string, uint,uint){
>>>>>>> origin/dev_arr
        return (hashUserMap[allUsersArray[_index]].email,
                hashUserMap[allUsersArray[_index]].reputation,
                hashUserMap[allUsersArray[_index]].numberOfPoints
        );
    }
<<<<<<< HEAD
    function getNumbers() onlyDapp public view returns(uint){
        return allUsersArray.length;
    }
    function setReview(bytes32 url,address author, uint256 _points) onlyRoot public{
=======
    function getNumbers() public onlyDapp view returns(uint){
        return allUsersArray.length;
    }
    function setReview(bytes32 url,address author, uint256 _points) public onlyRoot {
>>>>>>> origin/dev_arr
        address sender = tx.origin;
        require(hashUserMap[author].hash == author && hashUserMap[sender].hash == sender);

        uint numberOfTimesReview = hashUserMap[author].finishedCommits.length +1;
        uint value = hashUserMap[author].numberOfPoints + _points;
        hashUserMap[author].numberOfPoints = value;
        hashUserMap[author].reputation = value/numberOfTimesReview;

<<<<<<< HEAD
        for (uint j = 0 ; j< hashUserMap[sender].pendingReviews.length ; j++){
            if (url == hashUserMap[sender].pendingReviews[j]){
                hashUserMap[sender].pendingReviews[j]=hashUserMap[sender].pendingReviews[hashUserMap[sender].pendingReviews.length-1];
=======
        for (uint j = 0 ; j<hashUserMap[sender].pendingReviews.length;j++){
            if (url == hashUserMap[sender].pendingReviews[j]){
                hashUserMap[sender].pendingReviews[j] = hashUserMap[sender].pendingReviews[hashUserMap[sender].pendingReviews.length-1];
>>>>>>> origin/dev_arr
                hashUserMap[sender].pendingReviews.length--;
                break;
            }
        }
        hashUserMap[sender].finishedReviews.push(url);

<<<<<<< HEAD
        for (j = 0 ; j< hashUserMap[author].pendingCommits.length ; j++){
            if (url == hashUserMap[author].pendingCommits[j]){
                hashUserMap[author].pendingCommits[j]=hashUserMap[author].pendingCommits[hashUserMap[author].pendingCommits.length-1];
=======
        for (j = 0 ; j<hashUserMap[author].pendingCommits.length;j++){
            if (url == hashUserMap[author].pendingCommits[j]){
                hashUserMap[author].pendingCommits[j] = hashUserMap[author].pendingCommits[hashUserMap[author].pendingCommits.length-1];
>>>>>>> origin/dev_arr
                hashUserMap[author].pendingCommits.length--;
                break;
            }
        }
        hashUserMap[author].finishedCommits.push(url);
    }
}
