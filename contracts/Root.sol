pragma solidity 0.4.21;
import "./Bright.sol";
import "./Commits.sol";

contract Root{
  Bright remoteBright;
  address brightAddress;
  Commits remoteCommits;
  address commitsAddress;
  address owner;
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    modifier onlyCommit() {
        require(msg.sender == commitsAddress);
        _;
    }
    modifier onlyUser(){
        require(msg.sender == tx.origin);
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    function Root (address _bright, address _commits) public {
        owner = msg.sender;
        remoteBright = Bright(_bright);
        brightAddress = _bright;
        remoteCommits = Commits(_commits);
        commitsAddress = _commits;
    }
    function getHelperAddress() public view returns(address,address){
        return(brightAddress,commitsAddress);
    }

  function changeContractAddress(address _bright, address _commits) onlyOwner public{
    if(_bright != address(0)){
        remoteBright = Bright(_bright);
        brightAddress = _bright;
    }
	if(_commits != address(0)){
	    remoteCommits = Commits(_commits);
	    commitsAddress = _commits;
	}
  }
    function getUserAddressByEmail(string email) onlyUser public view returns(address){
        bytes32 index = keccak256(email);
        address a=remoteBright.getAddressByEmail(index);
        return a;
    }
    //sendNotificationOfNewCommit function must be called from the front after call setNewCommit
    function setNewCommit(bytes32 url) onlyCommit public {
        remoteBright.setCommit(url);
    }
    function notifyCommit (string url, bytes32[] _emails) onlyUser public {
        bytes32 _id = keccak256(url);
        address a;
        bool yes;
        bool auth;
        (yes, auth) = remoteCommits.isCommit(_id);
        require(auth);
        for (uint i=0;i<_emails.length;i++){
           a = remoteBright.getAddressByEmail(_emails[i]);
           if(a != address(0) && a != msg.sender){
               remoteCommits.notifyCommit(_id,a);
               remoteBright.notifyCommit(url, _emails[i]);
           }
        }
    }
    function readCommit(string url) onlyUser public {
        remoteCommits.readCommit(keccak256(url));
    }
    function setReview(bytes32 url,address a, uint256 points) onlyCommit public{
        remoteBright.setReview(url,a,points);
    }
    function setVote(bytes32 url, address user, uint8 vote) onlyUser public {
        remoteCommits.setVote(url,user,vote);
    }
}
