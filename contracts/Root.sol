pragma solidity 0.4.21;
import "./Bright.sol";
import "./Commits.sol";
import "./Reputation.sol";

import { Reputation } from "./Reputation.sol";

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
    function Root (address bright, address commits, uint16 seasonIndex, uint256 initialTimestamp) public {
        owner = msg.sender;
        remoteBright = Bright(bright);
        brightAddress = bright;
        remoteCommits = Commits(commits);
        commitsAddress = commits;
        remoteCommits.init(address(this));
        remoteBright.init(address(this), seasonIndex, initialTimestamp);
    }
    function getHelperAddress() public view returns(address, address){
        return(brightAddress,commitsAddress);
    }

    function changeContractAddress(address bright, address commits) public onlyOwner {
        if(bright != address(0)) {
            remoteBright = Bright(bright);
            brightAddress = bright;
        }
        if(commits != address(0)) {
            remoteCommits = Commits(commits);
            commitsAddress = commits;
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
    
    function setReview(bytes32 url,address a) public onlyCommit {
        remoteBright.setReview(url,a);
    }

    function setVote(string url, address user, uint8 vote) public onlyUser {
        bytes32 url_bytes = keccak256(url); 
        remoteCommits.setVote(url_bytes,user,vote);
        remoteBright.setFeedback(url_bytes, user, true, vote);
    }

    function setFeedback(string url,address user) public onlyUser {
        remoteBright.setFeedback(keccak256(url), user, false, 0);
    }

    function calculatePonderation(uint16[] cleanliness, uint16[] complexity, uint16[] revKnowledge) public onlyCommit view returns(uint32, uint32) {
        return Reputation.calculateCommitPonderation(cleanliness, complexity, revKnowledge);
    }

    function calculateUserReputation(bytes32 commitsUrl, uint32 reputation, uint32 cumulativeComplexity) public view returns (uint32, uint32) {
        uint32 commitScore;
        uint32 commitPonderation;
        uint32 previousScore;
        uint32 previousPonderation;
        (commitScore, commitPonderation, previousScore, previousPonderation) = remoteCommits.getCommitScores(commitsUrl);
        return  Reputation.calculateUserReputation(reputation, cumulativeComplexity, commitScore, commitPonderation, previousScore, previousPonderation);
    }

    function checkCommitSeason(bytes32 url,address author) public onlyCommit view returns (bool) {
        return remoteBright.checkCommitSeason(url,author);
    }
}
