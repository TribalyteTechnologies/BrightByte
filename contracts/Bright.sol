pragma solidity ^0.4.24;
import "./Ownable.sol";

contract Bright is Ownable {
    
    event SetUser (string name, address hash);
    mapping (address => UserProfile) public users;
    mapping (uint => UserProfile) allUsers;
    mapping (uint => Commit) storedData;
    uint numberUsers = 0;


    struct UserProfile {
        string name;
        string mail;
        address hash;
        uint numberCommitsReviewedbyMe;
        uint numberCommitsToReviewbyMe;
        uint numbermyCommits;
        mapping (uint => Commit) userCommits;
        mapping (uint => Commit) CommitsToReview;

        
    }
    struct Commit {
	    string url;
        address author;
        uint timestamp;
        string project;
        uint reviews;

    }

     function setProfile (string _name, string _mail) public {
        //require(_hash == msg.sender);
        if (bytes(users[msg.sender].name).length == 0 && bytes(users[msg.sender].mail).length == 0){
           
            users[msg.sender].name = _name;
            users[msg.sender].mail = _mail;
	        users[msg.sender].hash = msg.sender;
	        users[msg.sender].numberCommitsReviewedbyMe=0;
                users[msg.sender].numberCommitsToReviewbyMe=0;
                users[msg.sender].numbermyCommits=0;
                allUsers[numberUsers] = users[msg.sender];
                numberUsers++;

        }
        if(bytes(users[msg.sender].name).length != 0 || bytes(users[msg.sender].mail).length != 0){
            users[msg.sender].name = _name;
            users[msg.sender].mail = _mail;
        }
        emit SetUser(_name, msg.sender);
    }

    function getUser (address _hash) public view returns (string, string, uint, uint, uint) {
            
        if (msg.sender == _hash){ //If you are calling the function
        return (users[_hash].name,
                users[_hash].mail,
                users[_hash].numberCommitsReviewedbyMe,
                users[_hash].numberCommitsToReviewbyMe,
                users[_hash].numbermyCommits
                
		);
        } else{ //If other person is calling the function
		    return (users[_hash].name,"-",0,0,0);
		}
    }
    
    function setNewCommit (string _url, string _project, string _mailuser1, string _mailuser2, string _mailuser3, string _mailuser4) public { //_users separated by commas.
                
                uint a = uint256(keccak256(block.timestamp, block.difficulty, msg.sender)); // random id
                storedData[a] = Commit(_url, msg.sender, block.timestamp, _project, 0);
                users[msg.sender].userCommits[users[msg.sender].numbermyCommits]=storedData[a];
                users[msg.sender].numbermyCommits++;
                
                //Send the notificatios to reviewers
                for(uint i=0; i<numberUsers;i++){
                    
                    if(keccak256(allUsers[i].mail)==keccak256(_mailuser1)){
                        users[allUsers[i].hash].CommitsToReview[users[allUsers[i].hash].numberCommitsToReviewbyMe] = storedData[a];
                        users[allUsers[i].hash].numberCommitsToReviewbyMe = (users[allUsers[i].hash].numberCommitsToReviewbyMe + 1);
                        
                    }else
                    if(keccak256(allUsers[i].mail)==keccak256(_mailuser2)){
                        users[allUsers[i].hash].CommitsToReview[users[allUsers[i].hash].numberCommitsToReviewbyMe] = storedData[a];
                        users[allUsers[i].hash].numberCommitsToReviewbyMe = users[allUsers[i].hash].numberCommitsToReviewbyMe + 1;
                    }else
                    if(keccak256(allUsers[i].mail)==keccak256(_mailuser3)){
                        users[allUsers[i].hash].CommitsToReview[users[allUsers[i].hash].numberCommitsToReviewbyMe] = storedData[a];
                        users[allUsers[i].hash].numberCommitsToReviewbyMe = users[allUsers[i].hash].numberCommitsToReviewbyMe + 1;
                    }else
                    if(keccak256(allUsers[i].mail)==keccak256(_mailuser4)){
                        users[allUsers[i].hash].CommitsToReview[users[allUsers[i].hash].numberCommitsToReviewbyMe] = storedData[a];
                        users[allUsers[i].hash].numberCommitsToReviewbyMe = users[allUsers[i].hash].numberCommitsToReviewbyMe + 1;
                    }
                }
    }
    function getUserCommits(uint _index) public view returns(string){ //_index starts in 1
        return users[msg.sender].userCommits[_index-1].url;
    }
    function getNumberUserCommits()public view returns(uint){
        return users[msg.sender].numbermyCommits;
    }
}
