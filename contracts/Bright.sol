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
        mapping (uint => Commit) userCommits;
        mapping (uint => Commit) commitsToReview;

        
    }
    struct Commit {
        string id;
	    string url;
        address author;
        uint timestamp;
        string project;
        uint reviews;

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

    function getUser (address _hash) public view returns (string, string, uint, uint, uint) { //TODO: we need a getuser function using the email address instead of hash
            
        if (msg.sender == _hash){ //If you are calling the function
        return (hashUserMap[_hash].name,
                hashUserMap[_hash].email,
                hashUserMap[_hash].numberCommitsReviewedbyMe,
                hashUserMap[_hash].numberCommitsToReviewbyMe,
                hashUserMap[_hash].numbermyCommits
                );
        } else{ //If other person is calling the function
		    return (hashUserMap[_hash].name,"-",0,0,0);
		}
    }
    
    function setNewCommit (string _id, string _url, string _project, string _emailuser1, string _emailuser2, string _emailuser3, string _emailuser4) public { //_users separated by commas.
                
        storedData[_id] = Commit(_id, _url, msg.sender, block.timestamp, _project, 0);
        hashUserMap[msg.sender].userCommits[hashUserMap[msg.sender].numbermyCommits] = storedData[_id];
        hashUserMap[msg.sender].numbermyCommits++;
        
        //Send the notificatios to reviewers
        for(uint i = 0; i < numberOfUsers; i++){
            
            if(keccak256(allUsersArray[i].email) == keccak256(_emailuser1)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe = (hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe + 1);  
            }else if(keccak256(allUsersArray[i].email) == keccak256(_emailuser2)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe = hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe + 1;
            }else if(keccak256(allUsersArray[i].email) == keccak256(_emailuser3)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe = hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe + 1;
            }else if(keccak256(allUsersArray[i].email) == keccak256(_emailuser4)){
                hashUserMap[allUsersArray[i].hash].commitsToReview[hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe] = storedData[_id];
                hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe = hashUserMap[allUsersArray[i].hash].numberCommitsToReviewbyMe + 1;
            }
        }
    }
    function getUserCommits(uint _index) public view returns(string){ //_index starts in 1
        return hashUserMap[msg.sender].userCommits[_index-1].url;
    }
    function getNumberUserCommits()public view returns(uint){
        return hashUserMap[msg.sender].numbermyCommits;
    }
}