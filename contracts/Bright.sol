pragma solidity ^0.4.24;
import "./Ownable.sol";

contract Bright is Ownable {
    
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
        string id;
        string title;
	    string url;
        address author;
        uint timestamp;
        string project;
        uint numberReviews; 
        bool pending;
        uint currentNumberReviews;
        mapping (uint => Comment) comments;
    }
    struct Comment{
        string text;
        address user;
        uint stars;
    }
    function setProfile (string _name, string _email) public {
        //require(_hash == msg.sender);
        if (bytes(hashUserMap[msg.sender].name).length == 0 && bytes(hashUserMap[msg.sender].email).length == 0){
           
            hashUserMap[msg.sender].name = _name;
            hashUserMap[msg.sender].email = _email;
	        hashUserMap[msg.sender].hash = msg.sender;
	        hashUserMap[msg.sender].numberCommitsReviewedByMe = 0;
            hashUserMap[msg.sender].numberCommitsToReviewByMe = 0;
            hashUserMap[msg.sender].numbermyCommits=0;
            allUsersArray[numberOfUsers] = hashUserMap[msg.sender];
            numberOfUsers++;

        }
        if(bytes(hashUserMap[msg.sender].name).length > 0 || bytes(hashUserMap[msg.sender].email).length > 0){
            hashUserMap[msg.sender].name = _name;
            hashUserMap[msg.sender].email = _email;
        }
        emit UserProfileSetEvent(_name, msg.sender);
    }

    function getUser (address _hash) public view returns (string, string, uint, uint, uint, uint) { //TODO: we need a getuser function using the email address instead of hash
            
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
    
    function setNewCommit (string _id, string _title, string _url, string _project, string _emailuser1, string _emailuser2, string _emailuser3, string _emailuser4) public { //_users separated by commas.
        uint numUsers = 0;
        bool isPending = false;
        string[4] memory users = [_emailuser1,_emailuser2,_emailuser3,_emailuser4];
        for(uint j=0; j<users.length; j++){
            if(keccak256(bytes(users[j]))!=keccak256("")){ // Check if it Works
                numUsers++;
            }
        }
        if(numUsers>0){
            pending=true;
        }
        storedData[_id] = Commit(_id, _title, _url, msg.sender, block.timestamp, _project, numUsers, isPending, 0);
        hashUserMap[msg.sender].userCommits[hashUserMap[msg.sender].numbermyCommits] = storedData[_id];
        hashUserMap[msg.sender].numbermyCommits++;
        
        //Send the notificatios to reviewers
        for(uint i = 0; i < numberOfUsers; i++){
            
            if(keccak256(allUsersArray[i].email)==keccak256(_emailuser1)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe = (hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe + 1);  
            }else if(keccak256(allUsersArray[i].email)==keccak256(_emailuser2)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe = hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe + 1;
            }else if(keccak256(allUsersArray[i].email)==keccak256(_emailuser3)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe = hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe + 1;
            }else if(keccak256(allUsersArray[i].email)==keccak256(_emailuser4)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe = hashUserMap[allUsersArray[i].hash].numberCommitsToReviewByMe + 1;
            }
        }
    }
    function getDetailsCommits(string _id) public view returns(string, string, address, uint, uint, bool, uint){
        return (storedData[_id].url,
                storedData[_id].title,
                storedData[_id].author,
                storedData[_id].timestamp,
                storedData[_id].numberReviews,
                storedData[_id].pending, //No=>false and Yes=>true
                storedData[_id].currentNumberReviews);
    }
    function getUserCommits(uint _index) public view returns(string, string, string, bool){
        string storage id = hashUserMap[msg.sender].userCommits[_index].id;
        return (storedData[id].url,
                storedData[id].title,
                storedData[id].project,
                storedData[id].pending);
    }
    function getNumberUserCommits()public view returns(uint){
        return hashUserMap[msg.sender].numbermyCommits;
    }
    function getAllUserEmail(uint _index) public view returns(string){
        return allUsersArray[_index].email;
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
    function getCommentsOfCommit(uint _indexCommit, uint _indexComments)public view returns(string, address, string, uint){
        string storage id = hashUserMap[msg.sender].userCommits[_indexCommit].id; 
        return (storedData[id].comments[_indexComments].text, 
                storedData[id].comments[_indexComments].user, 
                hashUserMap[storedData[id].comments[_indexComments].user].name,
                storedData[id].comments[_indexComments].stars); 
    }
    function getNumberComments(uint _index)public view returns(uint){
        return storedData[hashUserMap[msg.sender].userCommits[_index].id].currentNumberReviews;
    }
    function setReview(uint _index, string _text, uint _points)public{
        string storage id = hashUserMap[msg.sender].commitsToReview[_index].id;
        storedData[id].comments[storedData[id].currentNumberReviews].text = _text;
        storedData[id].comments[storedData[id].currentNumberReviews].user = msg.sender;
        storedData[id].comments[storedData[id].currentNumberReviews].stars = _points/100;
        
        storedData[id].currentNumberReviews++;
        if(storedData[id].currentNumberReviews==storedData[id].numberReviews){
            storedData[id].pending = false;
        }
        //Reputation. The front end has to divide the result by 100
        address author = hashUserMap[msg.sender].commitsToReview[_index].author;
        hashUserMap[author].numberOfTimesReview++;
        uint value = hashUserMap[author].numberOfPoints + _points;
        hashUserMap[author].numberOfPoints = value;
        hashUserMap[author].reputation = value/hashUserMap[author].numberOfTimesReview;

        //User who has to review. 
        hashUserMap[msg.sender].commitsToReview[_index] = storedData[hashUserMap[msg.sender].commitsToReview[hashUserMap[msg.sender].numberCommitsToReviewByMe-1].id]; //the last commit of the list commitsToReviewByMe is on the position which had the commit i delete
        delete hashUserMap[msg.sender].commitsToReview[hashUserMap[msg.sender].numberCommitsToReviewByMe];
        hashUserMap[msg.sender].numberCommitsToReviewByMe--;
        hashUserMap[msg.sender].numberCommitsReviewedByMe++;
        
    }
}