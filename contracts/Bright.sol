pragma solidity ^0.4.24;

contract Bright {
    
    event UserProfileSetEvent (string name, address hash);
    mapping (address => UserProfile) private hashUserMap;
    address[] private allUsersArray;
    mapping (string => Commit) private storedData;
    address public owner;
        
    struct UserProfile {
        string name;
        string email;
        address hash;
        uint numberCommitsReviewedByMe; 
        uint reputation;
        uint numberOfTimesReview;
        uint numberOfPoints;
        string[] userCommits;
        string[] commitsToReview;
    }
    struct Commit {
        string title;
        string url;
        address author;
        uint creationDate;
        string project;
        bool isReadNeeded;
        uint numberReviews; 
        bool isPending;
        uint currentNumberReviews;
        uint lastModificationDate;
        uint score;
        uint points;
        address[] commitReviewFeedback;
        mapping (uint => CommitReview) comments; 
    }
    struct CommitReview{
        string text;
        address user;
        uint score;
        uint vote; //0 => no vote, 1 => dont agree, 2 => agree
        uint creationDate;
        uint lastModificationDate;
    }
    constructor () public { 
        owner = msg.sender;
    }
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    function setProfile (string _name, string _email) public {
        //require(_hash == msg.sender);
        if (bytes(hashUserMap[msg.sender].name).length == 0 && bytes(hashUserMap[msg.sender].email).length == 0){ 
            hashUserMap[msg.sender].name = _name;
            hashUserMap[msg.sender].email = _email;
            hashUserMap[msg.sender].hash = msg.sender;
            hashUserMap[msg.sender].numberCommitsReviewedByMe = 0; 
            allUsersArray.push(msg.sender);
        }
        if(bytes(hashUserMap[msg.sender].name).length > 0 || bytes(hashUserMap[msg.sender].email).length > 0){
            hashUserMap[msg.sender].name = _name;
            hashUserMap[msg.sender].email = _email;
        }
        emit UserProfileSetEvent(_name, msg.sender);
    }
    
    function getUser (address _hash) public view returns (string, string, uint, uint, uint, uint) {
            
        if (msg.sender == _hash){ //If you are calling the function
            return (hashUserMap[_hash].name, 
                    hashUserMap[_hash].email, 
                    hashUserMap[_hash].numberCommitsReviewedByMe, 
                    hashUserMap[_hash].commitsToReview.length, 
                    hashUserMap[_hash].userCommits.length, 
                    hashUserMap[_hash].reputation 
            ); 

        } else{ //If other person is calling the function
            return (hashUserMap[_hash].name,"-",0,0,0,0);
		}
    }
    
    function setNewCommit (string _title, string _url, string _project, string _emailuser1, string _emailuser2, string _emailuser3, string _emailuser4) public {
        uint numUsers = 0;
        bool isPending = false;
        string[4] memory users = [_emailuser1,_emailuser2,_emailuser3,_emailuser4];
        for(uint j = 0; j<users.length; j++){
            if(keccak256(bytes(users[j]))!=keccak256("")){
                numUsers++;
            }
        }
        if(numUsers>0){
            isPending = true;
        }
        address[] memory array;
        storedData[_url] = Commit(_title, _url, msg.sender, block.timestamp, _project, false, numUsers, isPending, 0, block.timestamp, 0, 0, array);
        hashUserMap[msg.sender].userCommits.push(_url);

        //Send the notificatios to reviewers
        for(uint i = 0; i < allUsersArray.length; i++){
            
            if(keccak256(hashUserMap[allUsersArray[i]].email) == keccak256(_emailuser1) || keccak256(hashUserMap[allUsersArray[i]].email) == keccak256(_emailuser2) || keccak256(hashUserMap[allUsersArray[i]].email) == keccak256(_emailuser3) || keccak256(hashUserMap[allUsersArray[i]].email) == keccak256(_emailuser4)){
                hashUserMap[allUsersArray[i]].commitsToReview.push(_url); 
                storedData[_url].commitReviewFeedback.push(hashUserMap[allUsersArray[i]].hash);
            }
        }
    }
    function getDetailsCommits(string _url) public view returns(string, string, address, uint, uint, bool, uint){
        return (storedData[_url].url,
                storedData[_url].title,
                storedData[_url].author,
                storedData[_url].creationDate,
                storedData[_url].numberReviews,
                storedData[_url].isPending,
                storedData[_url].currentNumberReviews
        );
    }
    function getUserCommits(uint _index) public view returns(string, string, string, bool, bool, uint, uint, uint){
        string memory url = hashUserMap[msg.sender].userCommits[_index];
        return (storedData[url].url,
                storedData[url].title,
                storedData[url].project,
                storedData[url].isPending,
                storedData[url].isReadNeeded,
                storedData[url].score,
                storedData[url].creationDate,
                storedData[url].lastModificationDate
        );
    }
    function getAllUser(uint _index) public view onlyOwner returns (address){
        return allUsersArray[_index];
    }
    function getAllUserReputation(uint _index) public view returns(string, uint, uint, uint){ 
        return (hashUserMap[allUsersArray[_index]].email,
                hashUserMap[allUsersArray[_index]].reputation,
                hashUserMap[allUsersArray[_index]].numberOfTimesReview,
                hashUserMap[allUsersArray[_index]].numberOfPoints
        ); 
    }
    function getNumbers() public view returns(uint, uint, uint){ 
        return (hashUserMap[msg.sender].userCommits.length,
                allUsersArray.length,
                hashUserMap[msg.sender].commitsToReview.length
        );
    }
    function getNumbersNeedUrl(string _url)public view returns (uint, uint){
        return (storedData[_url].currentNumberReviews,
                storedData[_url].commitReviewFeedback.length
        );
    }
    function getCommitsToReviewByMe(uint _index) public view returns(string, string, string, uint, uint, string){
        string memory url = hashUserMap[msg.sender].commitsToReview[_index];
        return (url,
            storedData[url].title,
            hashUserMap[storedData[url].author].name,
            storedData[url].creationDate,
            storedData[url].lastModificationDate,
            storedData[url].project
            );
    }
    function getCommentsOfCommit(string _url, uint _indexComments)public view returns(string, address, string, uint, uint, uint){
        return (storedData[_url].comments[_indexComments].text, 
                storedData[_url].comments[_indexComments].user, 
                hashUserMap[storedData[_url].comments[_indexComments].user].name,
                storedData[_url].comments[_indexComments].score,
                storedData[_url].comments[_indexComments].vote,
                storedData[_url].comments[_indexComments].lastModificationDate
        ); 
    }
    
    function setReview(uint _index, string _text, uint _points)public{
        
        string memory url = hashUserMap[msg.sender].commitsToReview[_index];
        storedData[url].comments[storedData[url].currentNumberReviews].text = _text;
        storedData[url].comments[storedData[url].currentNumberReviews].user = msg.sender;
        storedData[url].comments[storedData[url].currentNumberReviews].score = _points/100;
        storedData[url].comments[storedData[url].currentNumberReviews].creationDate = block.timestamp;
        storedData[url].comments[storedData[url].currentNumberReviews].lastModificationDate = block.timestamp;
        storedData[url].isReadNeeded = true;
        storedData[url].currentNumberReviews++;
        storedData[url].lastModificationDate = block.timestamp;
        if(storedData[url].currentNumberReviews==storedData[url].numberReviews){
            storedData[url].isPending = false;
        }
        //Reputation. The front end has to divide the result by 100
        address author = storedData[url].author;
        hashUserMap[author].numberOfTimesReview++;
        uint value = hashUserMap[author].numberOfPoints + _points;
        hashUserMap[author].numberOfPoints = value;
        hashUserMap[author].reputation = value/hashUserMap[author].numberOfTimesReview;
        
        //score per commit
        uint points = storedData[url].points;
        storedData[url].points = points + _points;
        storedData[url].score = storedData[url].points/storedData[url].currentNumberReviews;
 
        hashUserMap[msg.sender].numberCommitsReviewedByMe++;
    }
    function setVote(string _url, uint _indexComment, uint _vote) public {
        if(storedData[_url].comments[_indexComment].vote == 0){
            storedData[_url].comments[_indexComment].vote = _vote;
            storedData[_url].comments[_indexComment].lastModificationDate = block.timestamp;
            storedData[_url].commitReviewFeedback.push(storedData[_url].comments[_indexComment].user);
        }
    }
    function readComments(string _url) public{
        if(storedData[_url].author == msg.sender){
            storedData[_url].isReadNeeded = false;
        } else{
            bool isCopy = false;
            for(uint i = 0; i < storedData[_url].commitReviewFeedback.length; i++){
                if(!isCopy && storedData[_url].commitReviewFeedback[i] == msg.sender){
                    isCopy = true;
                }
                if(isCopy && i < storedData[_url].commitReviewFeedback.length - 1){
                    storedData[_url].commitReviewFeedback[i] = storedData[_url].commitReviewFeedback[i + 1];
                }
            }
            if(isCopy){
                storedData[_url].commitReviewFeedback.length--;
            }
        }
    }
    
    function isFeedback(uint _index, string _url)public view returns(bool){
        bool res = false;
        if(storedData[_url].commitReviewFeedback[_index] == msg.sender){
            res = true;
        }
        return res;
    }
}