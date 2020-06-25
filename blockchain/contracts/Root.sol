pragma solidity 0.4.22;

import "./Threshold.sol";
import "./CloudEventDispatcher.sol";

import { Reputation } from "./Reputation.sol";
import { IBright, ICommit, IRoot } from "./IBrightByte.sol";

contract Root is IRoot{
    mapping (address => bool) private adminUsers;
    mapping (address => bool) private allowedAddresses;

    IBright remoteBright;
    address brightAddress;
    ICommit remoteCommits;
    address commitsAddress;
    Threshold remoteThreshold;
    address thresholdAddress;
    CloudEventDispatcher remoteCloudEventDispatcher;
    address cloudEventDispatcherAddress;
    address owner;
    bool private isVersionEnable;
    bytes32 private brightbyteVersion;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


    modifier onlyAdmin() {
        require (adminUsers[msg.sender], "The origin address is not allowed. Not an admin");
        _;
    }
    modifier onlyCommit() {
        require(msg.sender == commitsAddress, "Sender is not commit contract");
        _;
    }
    modifier onlyBright() {
        require(msg.sender == brightAddress, "Sender is not bright contract");
        _;
    }

    modifier onlyAllowed() {
        require (allowedAddresses[msg.sender], "The address is not allowed.");
        _;
    }

    constructor (
        address bright, address commits, address threshold, address cloudEventDispatcher,
        address userAdmin, uint256 teamId, uint256 seasonLength) public {
        owner = msg.sender;
        remoteBright = IBright(bright);
        brightAddress = bright;
        remoteCommits = ICommit(commits);
        commitsAddress = commits;
        remoteThreshold = Threshold(threshold);
        thresholdAddress = threshold;
        remoteCloudEventDispatcher = CloudEventDispatcher(cloudEventDispatcher);
        cloudEventDispatcherAddress = cloudEventDispatcher;
        remoteCommits.init(address(this));
        remoteBright.init(address(this), cloudEventDispatcher, teamId, seasonLength, userAdmin);
        uint256 currentSeasonIndex;
        uint256 seasonFinaleTime;
        uint256 seasonLengthSecs;
        (currentSeasonIndex, seasonFinaleTime, seasonLengthSecs) = remoteBright.getCurrentSeason();
        remoteThreshold.init(address(this), currentSeasonIndex);
        adminUsers[userAdmin] = true;
        isVersionEnable = true;
    }

    function setVersion(bytes32 version) public {
        if(isVersionEnable) {
            brightbyteVersion = version;
            isVersionEnable = false;
        }
    }

    function getVersion() public view returns(bytes32) {
        return brightbyteVersion;
    }

    //sendNotificationOfNewCommit function must be called from the front after call setNewCommit
    function setNewCommit(bytes32 url) public onlyCommit {
        remoteBright.setCommit(url);
    }

    function notifyCommit (string url, bytes32[] _emails) public onlyAllowed {
        bytes32 _id = keccak256(url);
        address a;
        bool yes;
        bool auth;
        (yes, auth) = remoteCommits.isCommit(_id);
        require(auth, "Url is not a commit");
        if(remoteBright.checkCommitSeason(_id, msg.sender)) {
            for (uint i = 0; i < _emails.length; i++) {
                a = remoteBright.getAddressByEmail(_emails[i]);
                if(a != address(0) && a != msg.sender){
                    remoteCommits.notifyCommit(_id,a);
                    remoteBright.notifyCommit(url, _emails[i]);
                }
            }
        }
    }

    function readCommit(string url) public onlyAllowed {
        remoteCommits.readCommit(keccak256(url));
    }

    function setReview(bytes32 url,address a) public onlyCommit {
        remoteBright.setReview(url,a);
    }

    function setVote(string url, address user, uint256 vote) public onlyAllowed {
        bytes32 url_bytes = keccak256(url);
        remoteCommits.setVote(url_bytes,user,vote);
        remoteBright.setFeedback(url_bytes, user, true, vote);
    }

    function setFeedback(string url,address user) public onlyAllowed {
        remoteBright.setFeedback(keccak256(url), user, false, 0);
    }

    function calculatePonderation(uint256[] cleanliness, uint256[] complexity, uint256[] revKnowledge)
    public onlyCommit view returns(uint256, uint256) {
        return Reputation.calculateCommitPonderation(cleanliness, complexity, revKnowledge);
    }

    function calculateUserReputation(bytes32 commitsUrl, uint256 reputation, uint256 cumulativeComplexity)
    public onlyBright view returns (uint256, uint256) {
        uint256 commitScore;
        uint256 commitPonderation;
        uint256 previousScore;
        uint256 previousPonderation;
        (commitScore, commitPonderation, previousScore, previousPonderation) = remoteCommits.getCommitScores(commitsUrl);
        return  Reputation.calculateUserReputation(
            reputation, cumulativeComplexity, commitScore, commitPonderation, previousScore, previousPonderation);
    }

    function checkCommitSeason(bytes32 url,address author) public onlyCommit view returns (bool) {
        return remoteBright.checkCommitSeason(url,author);
    }

    function getNumberOfReviews(bytes32 url) public view onlyBright returns (uint, uint) {
        uint pending;
        uint finish;
        (pending, finish) = remoteCommits.getNumbersNeedUrl(url);
        return (pending, finish);
    }

    function deleteCommit(bytes32 url) public onlyBright {
        remoteCommits.deleteCommit(url);
    }

    function getCommitPendingReviewer(bytes32 url, uint reviewerIndex) public view onlyBright returns (address) {
        return remoteCommits.getCommitPendingReviewer(url, reviewerIndex);
    }

    function getSeasonThreshold(uint256 seasonIndex) public onlyAllowed view returns (uint256, uint256) {
        return remoteThreshold.getSeasonThreshold(seasonIndex);
    }

    function getCurrentSeasonThreshold() public onlyAllowed view returns (uint256, uint256) {
        return remoteThreshold.getCurrentSeasonThreshold();
    }

    function setIniatialThreshold(uint256 initialSeasonIndex, uint256[] commitsThreshold, uint256[] reviewsThreshold) public onlyAdmin {
        return remoteThreshold.setIniatialThreshold(initialSeasonIndex, commitsThreshold, reviewsThreshold);
    }

    function setCurrentSeasonThresholdOwner(uint256 commitsThreshold, uint256 reviewsThreshold) public onlyAdmin {
        return remoteThreshold.setCurrentSeasonThreshold(commitsThreshold, reviewsThreshold);
    }

    function setSeasonLength(uint256 seasonLengthDays) public onlyAdmin {
        return remoteBright.setSeasonLength(seasonLengthDays);
    }

    function setNewSeasonThreshold(uint256 currentSeasonIndex, uint256 averageNumberOfCommits, uint256 averageNumberOfReviews)
    public onlyBright {
        remoteThreshold.setNewSeasonThreshold(currentSeasonIndex, averageNumberOfCommits, averageNumberOfReviews);
    }

    function allowNewUser(address userAddress) public onlyBright {
        allowedAddresses[userAddress] = true;
        remoteCommits.allowNewUser(userAddress);
    }
}
