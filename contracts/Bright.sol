pragma solidity ^0.4.24;

contract Bright {
    
    event UserProfileSetEvent (string name, address hash);
    mapping (address => UserProfile) public hashUserMap;
    mapping (uint => UserProfile) allUsersArray;
    mapping (string => Commit) storedData;
    uint numberOfUsers = 0;

    struct UserProfile {
        string name;
        string email;
        address hash;
        uint numberCommitsReviewedByMe; 
        uint numberCommitsToReviewByMe; 
        uint numbermyCommits;
        uint reputation;
        uint numberOfTimesReview;
        uint numberOfPoints;
        mapping (uint => Commit) userCommits;
        mapping (uint => Commit) commitsToReview;
    }
    struct Commit {
        string title;
        string url;
        address author;
        uint timestamp;
        string project;
        bool isReadNeeded;
        uint numberReviews; 
        bool isPending;
        uint currentNumberReviews;
        mapping (uint => CommitReview) comments; 
    }
    struct CommitReview{
        string text;
        address user;
        uint score;
        uint vote; //0 => no vote, 1 => dont agree, 2 => agree
        uint timestamp;
    }
    function setProfile (string _name, string _email) public {
        //require(_hash == msg.sender);
        if (bytes(hashUserMap[msg.sender].name).length == 0 && bytes(hashUserMap[msg.sender].email).length == 0){ 
            hashUserMap[msg.sender].name = _name;
            hashUserMap[msg.sender].email = _email;
            hashUserMap[msg.sender].hash = msg.sender;
            hashUserMap[msg.sender].numberCommitsReviewedByMe = 0; 
            hashUserMap[msg.sender].numberCommitsToReviewByMe = 0;
            hashUserMap[msg.sender].numbermyCommits = 0;
            allUsersArray[numberOfUsers] = hashUserMap[msg.sender];
            numberOfUsers++;
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
                    hashUserMap[_hash].numberCommitsToReviewByMe, 
                    hashUserMap[_hash].numbermyCommits, 
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
        storedData[_url] = Commit(_title, _url, msg.sender, block.timestamp, _project, false, numUsers, isPending, 0);
        hashUserMap[msg.sender].userCommits[hashUserMap[msg.sender].numbermyCommits] = storedData[_url];
        hashUserMap[msg.sender].numbermyCommits++;
        
        //Send the notificatios to reviewers
        for(uint i = 0; i < numberOfUsers; i++){
            
            if(keccak256(allUsersArray[i].email) == keccak256(_emailuser1)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe] = storedData[_url]; 
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe++;  
            }else if(keccak256(allUsersArray[i].email) == keccak256(_emailuser2)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe] = storedData[_url]; 
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe++;
            }else if(keccak256(allUsersArray[i].email) == keccak256(_emailuser3)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe] = storedData[_url]; 
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe++;
            }else if(keccak256(allUsersArray[i].email) == keccak256(_emailuser4)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe] = storedData[_url]; 
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe++;
            }
        }
    }
    function getDetailsCommits(string _url) public view returns(string, string, address, uint, uint, bool, uint){
        return (storedData[_url].url,
                storedData[_url].title,
                storedData[_url].author,
                storedData[_url].timestamp,
                storedData[_url].numberReviews,
                storedData[_url].isPending,
                storedData[_url].currentNumberReviews
        );
    }
    function getUserCommits(uint _index) public view returns(string, string, bool, bool){
        string memory url = hashUserMap[msg.sender].userCommits[_index].url;
        return (storedData[url].title,
                storedData[url].project,
                storedData[url].isPending,
                storedData[url].isReadNeeded
        );
    }
    function getNumberUserCommits()public view returns(uint){
        return hashUserMap[msg.sender].numbermyCommits;
    }
    function getAllUserEmail(uint _index) public view returns(string){
        return allUsersArray[_index].email;
    }
    function getAllUserReputation(uint _index) public view returns(string, uint){ 
        return (allUsersArray[_index].email,
                hashUserMap[allUsersArray[_index].hash].reputation
        ); 
    }
    function getAllUserNumber() public view returns(uint){ 
        return numberOfUsers;
    }
    function getNumberCommitsToReviewByMe() public view returns(uint){ 
        return hashUserMap[msg.sender].numberCommitsToReviewByMe;
    }
    function getNumberCommitsReviewedByMe() public view returns(uint){ 
        return hashUserMap[msg.sender].numberCommitsReviewedByMe;
    }
    function getCommitsToReviewByMe(uint _index) public view returns(string, string, string){
        return (hashUserMap[msg.sender].commitsToReview[_index].url,
            hashUserMap[msg.sender].commitsToReview[_index].title,
            hashUserMap[hashUserMap[msg.sender].commitsToReview[_index].author].name);
    }
    function getCommentsOfCommit(uint _indexCommit, uint _indexComments)public view returns(string, address, string, uint, uint){
        string storage url = hashUserMap[msg.sender].userCommits[_indexCommit].url; 
        return (storedData[url].comments[_indexComments].text, 
                storedData[url].comments[_indexComments].user, 
                hashUserMap[storedData[url].comments[_indexComments].user].name,
                storedData[url].comments[_indexComments].score,
                storedData[url].comments[_indexComments].vote
        ); 
    }
    function getNumberComments(uint _index)public view returns(uint){
        return storedData[hashUserMap[msg.sender].userCommits[_index].url].currentNumberReviews;
    }
    function setReview(uint _index, string _text, uint _points)public{
        
        string storage url = hashUserMap[msg.sender].commitsToReview[_index].url;
        storedData[url].comments[storedData[url].currentNumberReviews].text = _text;
        storedData[url].comments[storedData[url].currentNumberReviews].user = msg.sender;
        storedData[url].comments[storedData[url].currentNumberReviews].score = _points/100;
        storedData[url].comments[storedData[url].currentNumberReviews].timestamp = block.timestamp;
        storedData[url].isReadNeeded = true;
        storedData[url].currentNumberReviews++;
        if(storedData[url].currentNumberReviews==storedData[url].numberReviews){
            storedData[url].isPending = false;
        }
        //Reputation. The front end has to divide the result by 100
        address author = hashUserMap[msg.sender].commitsToReview[_index].author;
        hashUserMap[author].numberOfTimesReview++;
        uint value = hashUserMap[author].numberOfPoints + _points;
        hashUserMap[author].numberOfPoints = value;
        hashUserMap[author].reputation = value/hashUserMap[author].numberOfTimesReview;
 
        //User who has to review. 
        hashUserMap[msg.sender].commitsToReview[_index] = storedData[hashUserMap[msg.sender].commitsToReview[hashUserMap[msg.sender].numberCommitsToReviewByMe-1].url]; //the last commit of the list commitsToReviewByMe is on the position which had the commit i delete
        delete hashUserMap[msg.sender].commitsToReview[hashUserMap[msg.sender].numberCommitsToReviewByMe];
        hashUserMap[msg.sender].numberCommitsToReviewByMe--;
        hashUserMap[msg.sender].numberCommitsReviewedByMe++;
        
    }
    function setVote(string _url, uint _indexComment, uint _vote) public {
        if(storedData[_url].comments[_indexComment].vote == 0){
            storedData[_url].comments[_indexComment].vote = _vote;
        }
    }
    function readComments(string _url) public{
        storedData[_url].isReadNeeded = false;
    }
}