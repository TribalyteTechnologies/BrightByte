// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "./CloudEventDispatcher.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import { BrightModels } from "./BrightModels.sol";
import { UtilsLib } from "./UtilsLib.sol";
import { IRoot, IBright } from "./IBrightByte.sol";

contract Bright is IBright, Initializable {
    using SafeMath for uint256;
    uint256 private constant FEEDBACK_MULTIPLER = 100;
    uint256 private constant HOUR_TO_SECS = 60 * 60;
    uint256 private constant DAY_LENGTH_SECS = 24 * HOUR_TO_SECS;
    uint256 private constant LIMIT_CHANGE_LENGTH = 2 * HOUR_TO_SECS;
    uint256 private constant MAX_SEASON_LENGTH_DAYS = 365 * 10;
    uint256 private deploymentTimestamp;
    uint256 private currentSeasonIndex;
    uint256 private initialSeasonTimestamp;
    uint256 private seasonLengthSecs;
    uint256 private teamUid;
    uint256 private brightbyteVersion;

    BrightModels.HashUserMap private hashUserMap;
    mapping (bytes32 => bool) private allCommits;
    mapping (bytes32 => bool) private invitedEmails;
    mapping (address => bool) private allowedAddresses;
    BrightModels.EmailUserMap private emailUserMap;
    address[] private allUsersArray;

    address private cloudEventDispatcherAddress;
    IRoot private root;
    address private rootAddress;
    CloudEventDispatcher private remoteCloudEventDispatcher;

    modifier onlyRoot() {
        require(msg.sender == rootAddress, "Invalid Root addresss");
        _;
    }

    modifier onlyAllowed() {
        require (allowedAddresses[msg.sender], "The address is not allowed");
        _;
    }

    modifier onlyInvited(bytes32 email) {
        require(invitedEmails[email], "The email is not allowed");
        _;
    }

    function initialize (address _root, address _cloudEventDispatcherAddress, uint256 teamId, uint256 seasonLength, address userAdmin)
    public override initializer {
        require(rootAddress == address(0), "Root address canot be 0");
        root = IRoot(_root);
        rootAddress = _root;
        cloudEventDispatcherAddress = _cloudEventDispatcherAddress;
        remoteCloudEventDispatcher = CloudEventDispatcher(cloudEventDispatcherAddress);
        currentSeasonIndex = 1;
        teamUid = teamId;
        initialSeasonTimestamp = block.timestamp;
        seasonLengthSecs = seasonLength * DAY_LENGTH_SECS;
        allowedAddresses[rootAddress] = true;
        allowedAddresses[userAdmin] = true;
    }

    function setVersion(uint256 version) public override {
        brightbyteVersion = version;
    }

    function inviteUserEmail(bytes32 email) public {
        invitedEmails[email] = true;
    }

    function setProfile(string memory name, bytes32 email) public onlyInvited(email) {
        address user = tx.origin;
        require(hashUserMap.map[user].email[0] == 0, "User already exists");
        BrightModels.UserProfile storage newUser = hashUserMap.map[user];
        newUser.name = name;
        newUser.email = email;
        newUser.hash = user;
        emailUserMap.map[email] = user;
        allUsersArray.push(user);
        remoteCloudEventDispatcher.emitNewUserEvent(teamUid, user, brightbyteVersion);
        allowedAddresses[user] = true;
        root.allowNewUser(user);
    }

    function setSeasonLength(uint256 seasonLengthDays) public override {
        uint256 changeLimitTime = initialSeasonTimestamp + seasonLengthSecs - LIMIT_CHANGE_LENGTH;
        require(currentSeasonIndex == 1 && block.timestamp < changeLimitTime, "Not able to change the seasons length");
        require(seasonLengthDays > 0 && seasonLengthDays < MAX_SEASON_LENGTH_DAYS, "Invalid season length");
        seasonLengthSecs = seasonLengthDays * DAY_LENGTH_SECS;
    }

    function getUsersAddress() public onlyAllowed view returns (address[] memory) {
        return allUsersArray;
    }

    function getAddressByEmail(bytes32 email) public override onlyAllowed view returns(address) {
        return emailUserMap.map[email];
    }

    function getUser(address userHash) public onlyAllowed view returns (string memory, bytes32, uint256, uint256, uint256, address) {
        return (
            hashUserMap.map[userHash].name,
            hashUserMap.map[userHash].email,
            hashUserMap.map[userHash].globalStats.reviewsMade,
            hashUserMap.map[userHash].globalStats.commitsMade,
            hashUserMap.map[userHash].globalStats.agreedPercentage,
            hashUserMap.map[userHash].hash
        );
    }

    function getUserSeasonReputation(address userHash, uint256 seasonIndex)
    public onlyAllowed view returns(string memory, bytes32, uint256, uint256, uint256, uint256, address, uint256) {
        BrightModels.UserProfile storage user = hashUserMap.map[userHash];
        BrightModels.UserSeason storage season = hashUserMap.map[userHash].seasonData[seasonIndex];
        return (hashUserMap.map[userHash].name,
            hashUserMap.map[userHash].email,
            season.seasonStats.reputation,
            season.seasonStats.reviewsMade,
            season.seasonStats.commitsMade,
            season.seasonStats.agreedPercentage,
            user.hash,
            season.seasonStats.cumulativeComplexity
        );
    }

    function setCommit(bytes32 url) public override onlyRoot {
        checkSeason();
        address sender = tx.origin;
        require ((hashUserMap.map[sender].hash == sender && !allCommits[url]), "Not able to set a new commit");
        BrightModels.UserProfile storage user = hashUserMap.map[sender];
        BrightModels.UserSeason storage userSeason = user.seasonData[currentSeasonIndex];
        allCommits[url] = true;
        userSeason.urlSeasonCommits.push(url);
        userSeason.seasonCommits[url] = true;
        userSeason.seasonStats.commitsMade++;
        user.globalStats.commitsMade++;
        remoteCloudEventDispatcher.emitNewCommitEvent(teamUid, sender, user.globalStats.commitsMade, brightbyteVersion);
    }

    function notifyCommit(string memory a, bytes32 email) public override onlyRoot {
        bytes32 url = keccak256(abi.encodePacked(a));
        address user = getAddressByEmail(email);
        require(user != address(0), "User address is 0");
        BrightModels.UserSeason storage reviewerSeason = hashUserMap.map[user].seasonData[currentSeasonIndex];
        bool done = false;
        for (uint256 i = 0; i < reviewerSeason.pendingReviews.length; i++){
            if(reviewerSeason.pendingReviews[i] == url){
                done = true;
                break;
            }
        }
        if (!done){
            reviewerSeason.pendingReviews.push(url);
            reviewerSeason.allReviews.push(url);
            reviewerSeason.toRead.push(url);
        }
    }

    function removeUserCommit(bytes32 url) public onlyAllowed {
        address userHash = tx.origin;
        uint256 finish;
        uint256 pending;
        (pending, finish) = root.getNumberOfReviews(url);
        BrightModels.UserProfile storage user = hashUserMap.map[userHash];
        BrightModels.UserSeason storage userSeason = user.seasonData[currentSeasonIndex];
        require (userSeason.seasonCommits[url] && finish == 0, "Commit doesn't exists");
        for(uint i = 0; i < pending; i++) {
            address reviewerHash = root.getCommitPendingReviewer(url, i);
            BrightModels.UserSeason storage reviewerSeason = hashUserMap.map[reviewerHash].seasonData[currentSeasonIndex];
            UtilsLib.removeFromArray(reviewerSeason.pendingReviews, url);
            UtilsLib.removeFromArray(reviewerSeason.allReviews, url);
        }
        UtilsLib.removeFromArray(userSeason.urlSeasonCommits, url);
        allCommits[url] = false;
        root.deleteCommit(url);
        user.globalStats.commitsMade--;
        userSeason.seasonStats.commitsMade--;
        delete userSeason.seasonCommits[url];
        remoteCloudEventDispatcher.emitDeletedCommitEvent(teamUid, userHash, url, brightbyteVersion);
    }

    function getUserSeasonState(address userHash, uint256 indSeason)
    public onlyAllowed view returns(uint256, uint256, uint256, uint256, uint256) {
        BrightModels.UserSeason storage userSeason = hashUserMap.map[userHash].seasonData[indSeason];
        return (UtilsLib.getNonEmptyPositions(userSeason.pendingReviews),
                UtilsLib.getNonEmptyPositions(userSeason.finishedReviews),
                UtilsLib.getNonEmptyPositions(userSeason.urlSeasonCommits),
                UtilsLib.getNonEmptyPositions(userSeason.toRead),
                UtilsLib.getNonEmptyPositions(userSeason.allReviews)
        );
    }

    function getUserSeasonCommits(address userHash, uint256 indSeason, uint256 start, uint256 end)
    public onlyAllowed view returns(bytes32[] memory, bytes32[] memory, bytes32[] memory, bytes32[] memory, bytes32[] memory) {
        BrightModels.UserSeason storage userSeason = hashUserMap.map[userHash].seasonData[indSeason];
        return (UtilsLib.splitArray(userSeason.pendingReviews, start, end),
                UtilsLib.splitArray(userSeason.finishedReviews, start, end),
                UtilsLib.splitArray(userSeason.urlSeasonCommits, start, end),
                UtilsLib.splitArray(userSeason.toRead, start, end),
                UtilsLib.splitArray(userSeason.allReviews, start, end)
        );
    }

    function getNumbers() public onlyAllowed view returns(uint){
        return allUsersArray.length;
    }

    function setReview(bytes32 url, address author) public override onlyRoot {
        address sender = tx.origin;
        require(hashUserMap.map[author].hash == author && hashUserMap.map[sender].hash == sender, "Author or sender is not correct");
        checkSeason();
        BrightModels.UserSeason storage userSeason = hashUserMap.map[author].seasonData[currentSeasonIndex];
        BrightModels.UserProfile storage reviewer = hashUserMap.map[sender];
        for (uint256 j = 0 ; j < reviewer.seasonData[currentSeasonIndex].pendingReviews.length; j++){
            if (url == reviewer.seasonData[currentSeasonIndex].pendingReviews[j]){
                reviewer.seasonData[currentSeasonIndex].pendingReviews[j] = reviewer.seasonData[currentSeasonIndex].pendingReviews[reviewer.seasonData[currentSeasonIndex].pendingReviews.length-1];
                reviewer.seasonData[currentSeasonIndex].pendingReviews.pop();
                break;
            }
        }
        hashUserMap.map[sender].seasonData[currentSeasonIndex].finishedReviews.push(url);
        if(userSeason.seasonCommits[url]) {
            (userSeason.seasonStats.reputation, userSeason.seasonStats.cumulativeComplexity) = root.calculateUserReputation(url, userSeason.seasonStats.reputation, userSeason.seasonStats.cumulativeComplexity);
            reviewer.seasonData[currentSeasonIndex].seasonStats.reviewsMade++;
            reviewer.globalStats.reviewsMade++;
        }
        remoteCloudEventDispatcher.emitNewReviewEvent(teamUid, sender, reviewer.globalStats.reviewsMade, brightbyteVersion);
    }

    function setUserName(string memory name) public onlyAllowed {
        address userHash = tx.origin;
        hashUserMap.map[userHash].name = name;
    }

    function getUserName(address userHash) public onlyAllowed view returns (string memory) {
        return (hashUserMap.map[userHash].name);
    }

    function isCommitPendingToRead(bytes32 url) public onlyAllowed view returns (bool){
        address sender = tx.origin;
        BrightModels.UserSeason storage userSeason = hashUserMap.map[sender].seasonData[currentSeasonIndex];
        bool read = false;
        for (uint i = 0; i < userSeason.toRead.length; i++){
            if(userSeason.toRead[i] == url){
                read = true;
            }
        }
        return read;
    }

    function readPendingCommit(string memory urlCommit) public onlyAllowed {
        address sender = msg.sender;
        bytes32 url = keccak256(abi.encodePacked(urlCommit));
        BrightModels.UserSeason storage userSeason = hashUserMap.map[sender].seasonData[currentSeasonIndex];
        UtilsLib.removeFromArray(userSeason.toRead, url);
    }

    function setFeedback(bytes32 url, address userAddr, bool value, uint256 vote) public override onlyRoot{
        address sender = userAddr;
        address maker = tx.origin;
        require(hashUserMap.map[sender].hash == sender && hashUserMap.map[maker].hash == maker, "Author or sender is not correct");
        BrightModels.UserProfile storage user = hashUserMap.map[sender];
        BrightModels.UserSeason storage userSeason = user.seasonData[currentSeasonIndex];
        checkSeason();
        if(value){
            userSeason.toRead.push(url);
            if(vote == 1) {
                user.globalStats.positeVotes++;
            }
            else if (vote == 2){
                user.globalStats.negativeVotes++;
            }
            user.globalStats.agreedPercentage = (user.globalStats.positeVotes * FEEDBACK_MULTIPLER) / (user.globalStats.positeVotes + user.globalStats.negativeVotes);
            if(hashUserMap.map[maker].seasonData[currentSeasonIndex].seasonCommits[url]) {
                setSeasonFeedback(sender, vote);
            }
        }
        else{
            for (uint256 i = 0 ; i < userSeason.toRead.length; i++){
                if (url == userSeason.toRead[i]){
                    userSeason.toRead[i] = userSeason.toRead[userSeason.toRead.length - 1];
                    userSeason.toRead.pop();
                    break;
                }
            }
        }
    }

    function getVotes(address userHash, bool global, uint256 indSeason) public onlyAllowed view returns (uint, uint) {
        return global ? (hashUserMap.map[userHash].globalStats.positeVotes, hashUserMap.map[userHash].globalStats.negativeVotes) :
            (hashUserMap.map[userHash].seasonData[indSeason].seasonStats.positeVotes, hashUserMap.map[userHash].seasonData[indSeason].seasonStats.negativeVotes);
    }

    function getCurrentSeason() public override onlyAllowed view returns (uint256, uint256, uint256) {
        uint256 totalTimeSeasons = currentSeasonIndex * seasonLengthSecs;
        uint256 seasonFinaleTime = initialSeasonTimestamp + totalTimeSeasons;
        return (currentSeasonIndex, seasonFinaleTime, seasonLengthSecs);
    }

    function checkCommitSeason(bytes32 url,address author) public override onlyAllowed view returns (bool) {
        return hashUserMap.map[author].seasonData[currentSeasonIndex].seasonCommits[url];
    }

    function setSeasonThresholds(uint256 seasonIndex, uint256 averageNumberOfCommits, uint256 averageNumberOfReviews) public onlyAllowed {
        root.setNewSeasonThreshold(seasonIndex, averageNumberOfCommits, averageNumberOfReviews);
    }

    function checkSeason() public onlyAllowed {
        uint256 seasonFinale = initialSeasonTimestamp + (currentSeasonIndex * seasonLengthSecs);
        bool isSeasonEnded = block.timestamp > seasonFinale;
        if (isSeasonEnded) {
            currentSeasonIndex++;
            remoteCloudEventDispatcher.emitNewSeason(teamUid, currentSeasonIndex, brightbyteVersion);
        }
    }

    function setSeasonFeedback(address user, uint256 vote) private {
        BrightModels.UserStats storage season = hashUserMap.map[user].seasonData[currentSeasonIndex].seasonStats;
        if(vote == 1){
            season.positeVotes++;
        } else {
            season.negativeVotes++;
        }
        season.agreedPercentage = (season.positeVotes * FEEDBACK_MULTIPLER) / (season.positeVotes + season.negativeVotes);
    }
}
