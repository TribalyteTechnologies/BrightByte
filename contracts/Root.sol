pragma solidity 0.4.21;
import "./Bright.sol";
import "./Commits.sol";
import "./Reputation.sol";

contract Root{
    Bright remoteBright;
    address brightAddress;
    Commits remoteCommits;
    address commitsAddress;
    Reputation remoteReputation;
    address reputationAddress;
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
    function Root (address bright, address commits, address reputation) public {
        owner = msg.sender;
        remoteBright = Bright(bright);
        brightAddress = bright;
        remoteCommits = Commits(commits);
        commitsAddress = commits;
        remoteReputation = Reputation(reputation);
        reputationAddress = reputation;
        remoteCommits.init(address(this));
        remoteBright.init(address(this));
        remoteReputation.init(address(this));
    }
    function getHelperAddress() public view returns(address,address){
        return(brightAddress,commitsAddress);
    }

    function changeContractAddress(address bright, address commits, address reputation) public onlyOwner {
        if(bright != address(0)) {
            remoteBright = Bright(bright);
            brightAddress = bright;
        }
        if(commits != address(0)) {
            remoteCommits = Commits(commits);
            commitsAddress = commits;
	    }
        if(reputation != address(0)) {
            remoteReputation = Reputation(reputation);
            reputationAddress = reputation;
	    }
    }
    function getUserAddressByEmail(string email) public onlyUser view returns(address){
        bytes32 index = keccak256(email);
        address a = remoteBright.getAddressByEmail(index);
        return a;
    }
    //sendNotificationOfNewCommit function must be called from the front after call setNewCommit
    function setNewCommit(bytes32 url) public onlyCommit {
        remoteBright.setCommit(url);
    }
    function notifyCommit (string url, bytes32[] _emails) public onlyUser {
        bytes32 _id = keccak256(url);
        address a;
        bool yes;
        bool auth;
        (yes, auth) = remoteCommits.isCommit(_id);
        require(auth);
        for (uint i = 0; i <_emails.length; i++){
            a = remoteBright.getAddressByEmail(_emails[i]);
            if(a != address(0) && a != msg.sender){
                remoteCommits.notifyCommit(_id,a);
                remoteBright.notifyCommit(url, _emails[i]);
            }
        }
    }

    function readCommit(string url) public onlyUser {
        remoteCommits.readCommit(keccak256(url));
    }
    
    function setReview(bytes32 url,address a, uint256 points) public onlyCommit {
        remoteBright.setReview(url,a,points);
    }

    function setVote(string url, address user, uint8 vote) public onlyUser {
        bytes32 url_bytes = keccak256(url);
        remoteCommits.setVote(url_bytes,user,vote);
        remoteBright.setFeedback(url_bytes, user, true, vote);
    }

    function setFeedback(string url,address user) public onlyUser {
        remoteBright.setFeedback(keccak256(url), user, false, 0);
    }

    function calculatePonderation(uint256[] points) public onlyCommit view returns(uint256) {
        return remoteReputation.calculatePonderation(points);
    }
}
