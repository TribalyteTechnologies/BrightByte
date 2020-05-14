pragma solidity 0.4.22;
import "./Root.sol";
import "./CloudEventDispatcher.sol";

import { BrightByteLib } from "./BrightByteLib.sol";
import { BrightModels } from "./BrightModels.sol";
import { UtilsLib } from "./UtilsLib.sol";

contract Bright {
    uint256 private constant FEEDBACK_MULTIPLER = 100;
    uint256 private constant HOUR_TO_SECS = 60 * 60;
    uint256 private constant DAY_LENGTH_SECS = 24 * HOUR_TO_SECS;
    uint256 private constant LIMIT_CHANGE_LENGTH = 2 * HOUR_TO_SECS;
    uint256 private constant MAX_SEASON_LENGTH = 365 * 10;
    uint256 private deploymentTimestamp;
    uint256 private currentSeasonIndex;
    uint256 private initialSeasonTimestamp;
    uint256 private seasonLengthSecs;
    uint256 private teamUid;

    BrightModels.HashUserMap private hashUserMap;
    mapping (bytes32 => bool) private allCommits;
    mapping (string => bool) private invitedEmails;
    mapping (address => bool) private allowAddresses;
    BrightModels.EmailUserMap private emailUserMap;
    address[] private allUsersArray;

    address private cloudEventDispatcherAddress;
    Root private root;
    address private rootAddress;
    CloudEventDispatcher private remoteCloudEventDispatcher;

    constructor() public {}

    modifier onlyRoot() {
        require(msg.sender == rootAddress, "Invalid Root addresss");
        _;
    }

    modifier onlyAllow() {
        require (allowAddresses[msg.sender], "The address is not allowed");
        _;
    }

    modifier onlyInvited(string email) {
        require(invitedEmails[email], "The email is not allowed");
        _;
    }

    function init(address _root, address _cloudEventDispatcherAddress, uint256 teamId, uint256 seasonLength, address userAdmin) public {
        require(rootAddress == uint80(0));
        root = Root(_root);
        rootAddress = _root;
        cloudEventDispatcherAddress = _cloudEventDispatcherAddress;
        remoteCloudEventDispatcher = CloudEventDispatcher(cloudEventDispatcherAddress);
        currentSeasonIndex = 1;
        teamUid = teamId;
        initialSeasonTimestamp = block.timestamp;
        seasonLengthSecs = seasonLength * DAY_LENGTH_SECS;
        allowAddresses[rootAddress] = true;
        allowAddresses[msg.sender] = true;
        allowAddresses[userAdmin] = true;
    }

    function inviteUserEmail(string email) public {
        invitedEmails[email] = true;
    }

    function setProfile (string name, string email) public onlyInvited(email) {
        address user = tx.origin;
        bytes32 emailId = keccak256(email);
        require(bytes(hashUserMap.map[user].email).length == 0, "User alredy exist");
        BrightModels.UserProfile storage newUser = hashUserMap.map[user];
        newUser.name = name;
        newUser.email = email;
        newUser.hash = user;
        emailUserMap.map[emailId] = user;
        allUsersArray.push(user);
        remoteCloudEventDispatcher.emitNewUserEvent(teamUid, user);
        allowAddresses[user] = true;
        root.allowNewUser(user);
    }

    function setSeasonLength(uint256 seasonLengthDays) public {
        uint256 changeLimitTime = initialSeasonTimestamp + seasonLengthSecs - LIMIT_CHANGE_LENGTH;
        require(currentSeasonIndex == 1 &&  block.timestamp < changeLimitTime, "Not able to change the seasons length");
        require(seasonLengthDays < MAX_SEASON_LENGTH, "Invalid season length");
        seasonLengthSecs = seasonLengthDays * DAY_LENGTH_SECS;
    }

    function getUsersAddress() public onlyAllow view returns (address[]) {
        return allUsersArray;
    }

    function getAddressByEmail(bytes32 email) public onlyAllow view returns(address) {
        return emailUserMap.map[email];
    }

    function getUser (address userHash) public onlyAllow view returns (string, string, uint256, uint256, uint256, address) {
        BrightModels.UserProfile memory user = hashUserMap.map[userHash];
        return (user.name,
            user.email,
            user.globalStats.reviewsMade,
            user.globalStats.commitsMade,
            user.globalStats.agreedPercentage,
            user.hash
        );
    }

    function getUserSeasonReputation(address userHash, uint256 seasonIndex) public onlyAllow view returns(string, string, uint256, uint256, uint256, uint256, address, uint256) {
        BrightModels.UserProfile memory user = hashUserMap.map[userHash];
        BrightModels.UserSeason memory season = hashUserMap.map[userHash].seasonData[seasonIndex];
        return (user.name,
            user.email,
            season.seasonStats.reputation,
            season.seasonStats.reviewsMade,
            season.seasonStats.commitsMade,
            season.seasonStats.agreedPercentage,
            user.hash,
            season.seasonStats.cumulativeComplexity
        );
    }

    function setCommit(bytes32 url) public onlyRoot {
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
        remoteCloudEventDispatcher.emitNewCommitEvent(teamUid, sender, user.globalStats.commitsMade);
    }

    function notifyCommit (string a, bytes32 email) public onlyRoot {
        bytes32 url = keccak256(a);
        address user = getAddressByEmail(email);
        require(user != address(0));
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

    function removeUserCommit(bytes32 url) public onlyAllow {
        address userHash = tx.origin;
        uint256 finish;
        uint256 pending;
        (pending, finish) = root.getNumberOfReviews(url);
        BrightModels.UserProfile storage user = hashUserMap.map[userHash];
        BrightModels.UserSeason storage userSeason = user.seasonData[currentSeasonIndex];
        require (userSeason.seasonCommits[url] && finish == 0);
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
        remoteCloudEventDispatcher.emitDeletedCommitEvent(teamUid, userHash, url);
    }
    
    function getUserSeasonState(address userHash, uint256 indSeason) public onlyAllow view returns(uint256, uint256, uint256, uint256, uint256) {
        BrightModels.UserSeason storage userSeason = hashUserMap.map[userHash].seasonData[indSeason];
        return (UtilsLib.getNonEmptyPositions(userSeason.pendingReviews),
                UtilsLib.getNonEmptyPositions(userSeason.finishedReviews),
                UtilsLib.getNonEmptyPositions(userSeason.urlSeasonCommits),
                UtilsLib.getNonEmptyPositions(userSeason.toRead),
                UtilsLib.getNonEmptyPositions(userSeason.allReviews)
        );
    }

    function getUserSeasonCommits(address userHash, uint256 indSeason, uint256 start, uint256 end) public onlyAllow view returns(bytes32[], bytes32[], bytes32[], bytes32[], bytes32[]) {
        BrightModels.UserSeason storage userSeason = hashUserMap.map[userHash].seasonData[indSeason];
        return (UtilsLib.splitArray(userSeason.pendingReviews, start, end),
                UtilsLib.splitArray(userSeason.finishedReviews, start, end),
                UtilsLib.splitArray(userSeason.urlSeasonCommits, start, end),
                UtilsLib.splitArray(userSeason.toRead, start, end),
                UtilsLib.splitArray(userSeason.allReviews, start, end)
        );
    }

    function getNumbers() public onlyAllow view returns(uint){
        return allUsersArray.length;
    }

    function setReview(bytes32 url,address author) public onlyRoot {
        address sender = tx.origin;
        require(hashUserMap.map[author].hash == author && hashUserMap.map[sender].hash == sender);
        checkSeason();
        BrightModels.UserSeason storage userSeason = hashUserMap.map[author].seasonData[currentSeasonIndex];
        BrightModels.UserProfile storage reviewer = hashUserMap.map[sender];
        for (uint256 j = 0 ; j < reviewer.seasonData[currentSeasonIndex].pendingReviews.length; j++){
            if (url == reviewer.seasonData[currentSeasonIndex].pendingReviews[j]){
                reviewer.seasonData[currentSeasonIndex].pendingReviews[j] = reviewer.seasonData[currentSeasonIndex].pendingReviews[reviewer.seasonData[currentSeasonIndex].pendingReviews.length-1];
                reviewer.seasonData[currentSeasonIndex].pendingReviews.length--;
                break;
            }
        }
        hashUserMap.map[sender].seasonData[currentSeasonIndex].finishedReviews.push(url);
        if(userSeason.seasonCommits[url]) {
            (userSeason.seasonStats.reputation, userSeason.seasonStats.cumulativeComplexity) = root.calculateUserReputation(url, userSeason.seasonStats.reputation, userSeason.seasonStats.cumulativeComplexity);
            reviewer.seasonData[currentSeasonIndex].seasonStats.reviewsMade++;
            reviewer.globalStats.reviewsMade++;
        }
        remoteCloudEventDispatcher.emitNewReviewEvent(teamUid, sender, reviewer.globalStats.reviewsMade);
    }

    function setUserName(string name) public onlyAllow {
        address userHash = tx.origin;
        hashUserMap.map[userHash].name = name;
    }

    function getUserName(address userHash) public onlyAllow view returns (string) {
        return (hashUserMap.map[userHash].name);
    }

    function getFeedback(bytes32 url) public onlyAllow view returns (bool){
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

    function setFeedback(bytes32 url, address userAddr, bool value, uint256 vote) public onlyRoot{
        address sender = userAddr;
        address maker = tx.origin;
        require(hashUserMap.map[sender].hash == sender && hashUserMap.map[maker].hash == maker);
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
                    userSeason.toRead.length--;
                    break;
                }
            }
        }
    }

    function getToRead(address userHash) public onlyAllow view returns (bytes32[]) {
        return (hashUserMap.map[userHash].seasonData[currentSeasonIndex].toRead);
    }

    function getVotes(address userHash, bool global, uint256 indSeason) public onlyAllow view returns (uint, uint) {
        return global ? (hashUserMap.map[userHash].globalStats.positeVotes, hashUserMap.map[userHash].globalStats.negativeVotes) : (hashUserMap.map[userHash].seasonData[indSeason].seasonStats.positeVotes, hashUserMap.map[userHash].seasonData[indSeason].seasonStats.negativeVotes);
    }

    function getCurrentSeason() public onlyAllow view returns (uint256, uint256, uint256) {
        uint256 totalTimeSeasons = currentSeasonIndex * seasonLengthSecs;
        uint256 seasonFinaleTime = initialSeasonTimestamp + totalTimeSeasons;
        return (currentSeasonIndex, seasonFinaleTime, seasonLengthSecs);
    }

    function checkCommitSeason(bytes32 url,address author) public onlyAllow view returns (bool) {
        return hashUserMap.map[author].seasonData[currentSeasonIndex].seasonCommits[url];
    }

    function getTeamId() public onlyAllow view returns (uint256) {
        return teamUid;
    }

    function checkSeason() private {
        uint256 seasonFinale = initialSeasonTimestamp + (currentSeasonIndex * seasonLengthSecs);
        if(block.timestamp > seasonFinale) {
            uint256 commitAverage;
            uint256 reviewAverage;
            (commitAverage, reviewAverage) = BrightByteLib.calculateSeasonAverages(hashUserMap, allUsersArray, currentSeasonIndex);
            currentSeasonIndex++;
            root.setNewSeasonThreshold(currentSeasonIndex, commitAverage, reviewAverage);
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
