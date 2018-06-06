pragma solidity ^0.4.24;
import "./Ownable.sol";


contract Bright is Ownable {
    
    event SetUser (string name, address hash);
    mapping (address => UserProfile) public users;
    mapping (uint => UserProfile) allUsers;
    uint numberUsers = 0;


    struct UserProfile {
        string name;
        string mail;
        address hash;
    }

     function setProfile (string _name, string _mail, address _hash) public {
        //require(_hash == msg.sender);
        if (bytes(users[msg.sender].name).length == 0 && bytes(users[msg.sender].mail).length == 0){
            allUsers[numberUsers].hash = _hash;
            numberUsers++;
            users[msg.sender].name = _name;
            users[msg.sender].mail = _mail;
	        users[msg.sender].hash = _hash;
        }
        if(bytes(users[msg.sender].name).length != 0 || bytes(users[msg.sender].mail).length != 0){
            users[msg.sender].name = _name;
            users[msg.sender].mail = _mail;
        }
        emit SetUser(_name, msg.sender);
    }

    function getUser (address _hash) public view returns (string, string) {
            //On Solidity you can't return a struct nor an string array
        require(msg.sender == _hash);
        return (users[_hash].name,
                users[_hash].mail
		);
    }
}


