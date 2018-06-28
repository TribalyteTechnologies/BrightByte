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
        uint numberCommitsReviewedbyMe;
        uint numberCommitsToReviewbyMe;
        uint numbermyCommits;
        uint reputation;
        uint numberOfTimesReview;
        uint numberOfPoints;
        mapping (uint => Commit) userCommits;
        mapping (uint => Commit) commitsToReview;
    }
    struct Commit {
        string id;
	    string url;
        address author;
        uint timestamp;
        string project;
        uint numberReviews; 
        bool pending;
        uint currentNumberReviews;
        mapping (uint => comment) comments;
    }
    struct comment{
        string text;
        address user;
    }
    function setProfile (string _name, string _email) public {
        //require(_hash == msg.sender);
        if (bytes(hashUserMap[msg.sender].name).length == 0 && bytes(hashUserMap[msg.sender].email).length == 0){
           
            hashUserMap[msg.sender].name = _name;
            hashUserMap[msg.sender].email = _email;
	        hashUserMap[msg.sender].hash = msg.sender;
	        hashUserMap[msg.sender].numberCommitsReviewedbyMe = 0;
            hashUserMap[msg.sender].numberCommitsToReviewbyMe = 0;
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
                hashUserMap[_hash].numberCommitsReviewedbyMe,
                hashUserMap[_hash].numberCommitsToReviewbyMe,
                hashUserMap[_hash].numbermyCommits,
                hashUserMap[_hash].reputation
                );
        } else{ //If other person is calling the function
		    return (hashUserMap[_hash].name,"-",0,0,0,0);
		}
    }
    
    function setNewCommit (string _id, string _url, string _project, string _emailuser1, string _emailuser2, string _emailuser3, string _emailuser4) public { //_users separated by commas.
        uint num = 0;
        bool pending = false;
        if(keccak256(_emailuser1)!=keccak256("")){num++;}
        if(keccak256(_emailuser2)!=keccak256("")){num++;}
        if(keccak256(_emailuser3)!=keccak256("")){num++;}
        if(keccak256(_emailuser4)!=keccak256("")){num++;}
        if(num>0){pending=true;}
        storedData[_id] = Commit(_id, _url, msg.sender, block.timestamp, _project, num, pending, 0);
        hashUserMap[msg.sender].userCommits[hashUserMap[msg.sender].numbermyCommits] = storedData[_id];
        hashUserMap[msg.sender].numbermyCommits++;
        
        //Send the notificatios to reviewers
        for(uint i = 0; i < numberOfUsers; i++){
            
            if(keccak256(allUsersArray[i].email)==keccak256(_emailuser1)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe = (hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe + 1);  
            }else if(keccak256(allUsersArray[i].email)==keccak256(_emailuser2)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe = hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe + 1;
            }else if(keccak256(allUsersArray[i].email)==keccak256(_emailuser3)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe = hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe + 1;
            }else if(keccak256(allUsersArray[i].email)==keccak256(_emailuser4)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe = hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe + 1;
            }
        }
    }
    function getDetailsCommits(string _id) public view returns(string, address, uint, string, uint, bool, uint){ //_index starts in 1
        return (storedData[_id].url,
                storedData[_id].author,
                storedData[_id].timestamp,
                storedData[_id].project,
                storedData[_id].numberReviews,
                storedData[_id].pending, //No=>false and Yes=>true
                storedData[_id].currentNumberReviews);
    }
    function getUserCommits(uint _index) public view returns(string, string, bool){
        return (storedData[hashUserMap[msg.sender].userCommits[_index].id].url,
                storedData[hashUserMap[msg.sender].userCommits[_index].id].project,
                storedData[hashUserMap[msg.sender].userCommits[_index].id].pending);
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
        return hashUserMap[msg.sender].numberCommitsToReviewbyMe;
    }
    function getNumberCommitsReviewedByMe() public view returns(uint){ 
        return hashUserMap[msg.sender].numberCommitsReviewedbyMe;
    }
    function getCommitsToReviewByMe(uint _index) public view returns(string, string){
        return (hashUserMap[msg.sender].commitsToReview[_index].url,
            hashUserMap[hashUserMap[msg.sender].commitsToReview[_index].author].name);
    }
    function getCommentsOfCommit(uint _indexCommit, uint _indexComments)public view returns(string, address, string){
        return (storedData[hashUserMap[msg.sender].userCommits[_indexCommit].id].comments[_indexComments].text,
                storedData[hashUserMap[msg.sender].userCommits[_indexCommit].id].comments[_indexComments].user,
                hashUserMap[storedData[hashUserMap[msg.sender].userCommits[_indexCommit].id].comments[_indexComments].user].name);
    }
    function getNumberComments(uint _index)public view returns(uint){
        return storedData[hashUserMap[msg.sender].userCommits[_index].id].currentNumberReviews;
    }
    function setReview(uint _index, string _text, uint _points)public{
        
        storedData[hashUserMap[msg.sender].commitsToReview[_index].id].comments[storedData[hashUserMap[msg.sender].commitsToReview[_index].id].currentNumberReviews].text = _text;
        storedData[hashUserMap[msg.sender].commitsToReview[_index].id].comments[storedData[hashUserMap[msg.sender].commitsToReview[_index].id].currentNumberReviews].user = msg.sender;
        
        storedData[hashUserMap[msg.sender].commitsToReview[_index].id].currentNumberReviews++;
        if(storedData[hashUserMap[msg.sender].commitsToReview[_index].id].currentNumberReviews==storedData[hashUserMap[msg.sender].commitsToReview[_index].id].numberReviews){
            storedData[hashUserMap[msg.sender].commitsToReview[_index].id].pending = false;
        }
        //Reputation. The front end has to divide the result by 100
        hashUserMap[hashUserMap[msg.sender].commitsToReview[_index].author].numberOfTimesReview++;
        uint value = hashUserMap[hashUserMap[msg.sender].commitsToReview[_index].author].numberOfPoints + _points;
        hashUserMap[hashUserMap[msg.sender].commitsToReview[_index].author].numberOfPoints = value;
        hashUserMap[hashUserMap[msg.sender].commitsToReview[_index].author].reputation = value/hashUserMap[hashUserMap[msg.sender].commitsToReview[_index].author].numberOfTimesReview;

        //User who has to review. 
        hashUserMap[msg.sender].commitsToReview[_index] = storedData[hashUserMap[msg.sender].commitsToReview[hashUserMap[msg.sender].numberCommitsToReviewbyMe-1].id]; //the last commit of the list commitsToReviewByMe is on the position which had the commit i delete
        delete hashUserMap[msg.sender].commitsToReview[hashUserMap[msg.sender].numberCommitsToReviewbyMe];
        hashUserMap[msg.sender].numberCommitsToReviewbyMe--; //decrease counter
        hashUserMap[msg.sender].numberCommitsReviewedbyMe++; //encrease counter
        
    }
}