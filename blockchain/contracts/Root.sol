pragma solidity 0.4.21;
import "./Bright.sol";
import "./Commits.sol";

import { Reputation } from "./Reputation.sol";

contract Root{
    Bright remoteBright;
    address brightAddress;
    Commits remoteCommits;
    address commitsAddress;
    address owner;
    bytes32 version;
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

    function getVersion() public view returns (bytes32){
        return version;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    function Root (address bright, address commits, uint256 seasonIndex, uint256 initialTimestamp, bytes32 ver) public {
        owner = msg.sender;
        remoteBright = Bright(bright);
        brightAddress = bright;
        remoteCommits = Commits(commits);
        commitsAddress = commits;
        version = ver;
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

    function setVote(string url, address user, uint256 vote) public onlyUser {
        bytes32 url_bytes = keccak256(url); 
        remoteCommits.setVote(url_bytes,user,vote);
        remoteBright.setFeedback(url_bytes, user, true, vote);
    }

    function setFeedback(string url,address user) public onlyUser {
        remoteBright.setFeedback(keccak256(url), user, false, 0);
    }

    function calculatePonderation(uint256[] cleanliness, uint256[] complexity, uint256[] revKnowledge) public onlyCommit view returns(uint256, uint256) {
        return Reputation.calculateCommitPonderation(cleanliness, complexity, revKnowledge);
    }

    function calculateUserReputation(bytes32 commitsUrl, uint256 reputation, uint256 cumulativeComplexity) public view returns (uint256, uint256) {
        uint256 commitScore;
        uint256 commitPonderation;
        uint256 previousScore;
        uint256 previousPonderation;
        (commitScore, commitPonderation, previousScore, previousPonderation) = remoteCommits.getCommitScores(commitsUrl);
        return  Reputation.calculateUserReputation(reputation, cumulativeComplexity, commitScore, commitPonderation, previousScore, previousPonderation);
    }

    function checkCommitSeason(bytes32 url,address author) public onlyCommit view returns (bool) {
        return remoteBright.checkCommitSeason(url,author);
    }

    function getNumberOfReviews(bytes32 url) public view returns (uint) {
        uint pending;
        uint finish;
        (pending, finish) = remoteCommits.getNumbersNeedUrl(url);
        return finish;
    }

    function deleteCommit(bytes32 url) public {
        remoteCommits.deleteCommit(url);
    }

    function getCommitPendingReviewer(bytes32 url, uint reviewerIndex) public view returns (address) {
        return remoteCommits.getCommitPendingReviewer(url, reviewerIndex);
    }
     
}
