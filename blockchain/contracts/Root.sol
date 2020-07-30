pragma solidity 0.5.17;

import "./openzeppelin/Initializable.sol";
import "./BrightByteSettings.sol";
import "./CloudEventDispatcher.sol";
import { Reputation } from "./Reputation.sol";
import { IBright, ICommit, IRoot } from "./IBrightByte.sol";

contract Root is IRoot, Initializable {

    mapping (address => bool) private adminUsers;
    mapping (address => bool) private allowedAddresses;
    IBright private remoteBright;
    address private brightAddress;
    ICommit private remoteCommits;
    address private commitsAddress;
    BrightByteSettings private remoteSettings;
    address private settingAddress;
    CloudEventDispatcher private remoteCloudEventDispatcher;
    address private cloudEventDispatcherAddress;
    address private owner;
    bool private isVersionEnable;
    bytes32 private brightbyteVersion;

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

    function initialize (
        address bright, address commits, address settings, address cloudEventDispatcher,
        address userAdmin, uint256 teamId, uint256 seasonLength) public initializer {
        owner = msg.sender;
        remoteBright = IBright(bright);
        brightAddress = bright;
        remoteCommits = ICommit(commits);
        commitsAddress = commits;
        remoteSettings = BrightByteSettings(settings);
        settingAddress = settings;
        remoteCloudEventDispatcher = CloudEventDispatcher(cloudEventDispatcher);
        cloudEventDispatcherAddress = cloudEventDispatcher;
        remoteCommits.initialize(address(this));
        remoteBright.initialize(address(this), cloudEventDispatcher, teamId, seasonLength, userAdmin);
        uint256 currentSeasonIndex;
        uint256 seasonFinaleTime;
        uint256 seasonLengthSecs;
        (currentSeasonIndex, seasonFinaleTime, seasonLengthSecs) = remoteBright.getCurrentSeason();
        remoteSettings.initialize(address(this), currentSeasonIndex);
        adminUsers[userAdmin] = true;
        isVersionEnable = true;
    }

    function setVersion(bytes32 version) public {
        if(isVersionEnable) {
            brightbyteVersion = version;
            isVersionEnable = false;
        }
    }

    function addAdminUser(address memberAddress) public {
        adminUsers[memberAddress] = true;
        allowedAddresses[memberAddress] = true;
    }

    function getVersion() public view returns(bytes32) {
        return brightbyteVersion;
    }

    //sendNotificationOfNewCommit function must be called from the front after call setNewCommit
    function setNewCommit(bytes32 url) public onlyCommit {
        remoteBright.setCommit(url);
    }

    function notifyCommit (string memory url, bytes32[] memory _emails) public onlyAllowed {
        bytes32 _id = keccak256(abi.encodePacked(url));
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

    function readCommit(string memory url) public onlyAllowed {
        remoteCommits.readCommit(keccak256(abi.encodePacked(url)));
    }

    function setReview(bytes32 url,address a) public onlyCommit {
        remoteBright.setReview(url,a);
    }

    function setVote(string memory url, address user, uint256 vote) public onlyAllowed {
        bytes32 url_bytes = keccak256(abi.encodePacked(url));
        remoteCommits.setVote(url_bytes,user,vote);
        remoteBright.setFeedback(url_bytes, user, true, vote);
    }

    function setFeedback(string memory url,address user) public onlyAllowed {
        remoteBright.setFeedback(keccak256(abi.encodePacked(url)), user, false, 0);
    }

    function calculatePonderation(uint256[] memory cleanliness, uint256[] memory complexity, uint256[] memory revKnowledge)
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
        return remoteSettings.getSeasonThreshold(seasonIndex);
    }

    function getCurrentSeasonThreshold() public onlyAllowed view returns (uint256, uint256) {
        return remoteSettings.getCurrentSeasonThreshold();
    }

    function setIniatialThreshold(uint256 initialSeasonIndex, uint256[] memory commitsThreshold, uint256[] memory reviewsThreshold)
    public onlyAdmin {
        return remoteSettings.setIniatialThreshold(initialSeasonIndex, commitsThreshold, reviewsThreshold);
    }

    function setCurrentSeasonThresholdOwner(uint256 commitsThreshold, uint256 reviewsThreshold) public onlyAdmin {
        return remoteSettings.setCurrentSeasonThreshold(commitsThreshold, reviewsThreshold);
    }

    function setSeasonLength(uint256 seasonLengthDays) public onlyAdmin {
        return remoteBright.setSeasonLength(seasonLengthDays);
    }

    function setNewSeasonThreshold(uint256 currentSeasonIndex, uint256 averageNumberOfCommits, uint256 averageNumberOfReviews)
    public onlyBright {
        remoteSettings.setNewSeasonThreshold(currentSeasonIndex, averageNumberOfCommits, averageNumberOfReviews);
    }

    function allowNewUser(address userAddress) public onlyBright {
        allowedAddresses[userAddress] = true;
        remoteCommits.allowNewUser(userAddress);
    }

    function getTextRules() public view onlyAllowed returns(bytes32[] memory){
        return remoteSettings.getTextRules();
    }

    function addTextRules(bytes32 newText) public onlyAdmin {
        remoteSettings.addTextRules(newText);
    }

    function clearTextRules() public onlyAdmin {
        remoteSettings.clearTextRules();
    }

    function getRandomReviewer() public view onlyAllowed returns(bool) {
        return remoteSettings.getRandomReviewer();
    }

    function setRandomReviewer(bool newValue) public onlyAdmin {
        remoteSettings.setRandomReviewer(newValue);
    }
}
