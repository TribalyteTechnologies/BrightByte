pragma solidity 0.4.22;
import "./Root.sol";

import { MigrationLib } from "./MigrationLib.sol";
import { BrightModels } from "./BrightModels.sol";
import { UtilsLib } from "./UtilsLib.sol";

contract Bright {
    uint256 private constant FEEDBACK_MULTIPLER = 100;
    uint256 private constant DAY_LENGTH_SECS = 24 * 60 * 60;
    Root private root;
    uint256 private deploymentTimestamp;
    uint256 private currentSeasonIndex;
    uint256 private initialSeasonTimestamp;
    uint256 private seasonLengthSecs;
    BrightModels.HashUserMap private hashUserMap;
    BrightModels.EmailUserMap private emailUserMap;
    address[] private allUsersArray;
    bytes32[] private allCommitsArray;

    address private rootAddress;
    address private owner;
    
    event UserProfileSetEvent (string name, address hash);
    event UserNewCommit (address userHash, uint256 numberOfCommits);
    event UserNewReview (address userHash, uint256 numberOfReviews);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SeasonEnds (uint256 currentSeason);
    event DeletedCommit (address userHash, bytes32 url);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyRoot() {
        require(msg.sender == rootAddress);
        _;
    }

    modifier onlyDapp() {
        require (msg.sender == rootAddress || msg.sender == tx.origin);
        _;
    }

    function init(address _root, uint256 initialTimestamp, uint256 seasonLengthDays) public {
        require(rootAddress == uint80(0));
        root = Root(_root);
        rootAddress = _root;
        currentSeasonIndex = 1;
        initialSeasonTimestamp = initialTimestamp;
        deploymentTimestamp = block.timestamp;
        seasonLengthSecs = seasonLengthDays * DAY_LENGTH_SECS;
        uint256 seasonFinale = initialSeasonTimestamp + (currentSeasonIndex * seasonLengthSecs);
        while(deploymentTimestamp > seasonFinale) {
            currentSeasonIndex++;
            seasonFinale = seasonFinale + seasonLengthSecs;
        }
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setRootAddress(address a) public onlyOwner {
        rootAddress = a;
    }

    function setProfile (string name, string email) public onlyDapp {
        address user = tx.origin;
        bytes32 emailId = keccak256(email);
        if (bytes(hashUserMap.map[user].name).length == 0 && bytes(hashUserMap.map[user].email).length == 0){
            BrightModels.UserProfile storage newUser = hashUserMap.map[user];
            newUser.name = name;
            newUser.email = email;
            newUser.hash = user;
            emailUserMap.map[emailId] = user;
            allUsersArray.push(user);
        } else {
            bytes32 userEmail = keccak256(hashUserMap.map[user].email);
            if(emailId == userEmail) {
                require(emailUserMap.map[emailId] == address(0));
                delete emailUserMap.map[userEmail];
                hashUserMap.map[user].email = email;
                emailUserMap.map[emailId] = user;
            }
            hashUserMap.map[user].name = name;
        }
        emit UserProfileSetEvent(name, user);
    }

    function getUsersAddress() public onlyDapp view returns (address[]) {
        return allUsersArray;
    }

    function getAddressByEmail(bytes32 email) public onlyDapp view returns(address) {
        return emailUserMap.map[email];
    }

    function getUser (address userHash) public onlyDapp view returns (string, string, uint256, uint256, uint256, address) {
        BrightModels.UserProfile memory user = hashUserMap.map[userHash];
        return (user.name,
            user.email,
            user.globalStats.reviewsMade,
            user.globalStats.commitsMade,
            user.globalStats.agreedPercentage,
            user.hash
        );
    }

    function getUserSeasonReputation(address userHash, uint256 seasonIndex) public onlyDapp view returns(string, string, uint256, uint256, uint256, uint256, address) {
        BrightModels.UserProfile memory user = hashUserMap.map[userHash];
        BrightModels.UserSeason memory season = hashUserMap.map[userHash].seasonData[seasonIndex];
        return (user.name,
            user.email,
            season.seasonStats.reputation,
            season.seasonStats.reviewsMade,
            season.seasonStats.commitsMade,
            season.seasonStats.agreedPercentage,
            user.hash
        );
    }

    function setCommit(bytes32 url) public onlyRoot {
        checkSeason();
        address sender = tx.origin;
        bool saved = false;
        for (uint256 i = 0; i < allCommitsArray.length; i++){
            if(allCommitsArray[i] == url){
                saved = true;
                break;
            }
        }
        if(!saved){
            BrightModels.UserProfile storage user = hashUserMap.map[sender];
            allCommitsArray.push(url);
            BrightModels.UserSeason storage userSeason = user.seasonData[currentSeasonIndex];
            userSeason.urlSeasonCommits.push(url);
            userSeason.seasonCommits[url] = true;
            userSeason.seasonStats.commitsMade++;
            user.globalStats.commitsMade++;
            emit UserNewCommit(sender, user.globalStats.commitsMade);
        }
    }

    function notifyCommit (string a, bytes32 email) public onlyRoot {
        bytes32 url = keccak256(a);
        address sender = tx.origin;
        address user = getAddressByEmail(email);
        require(user != address(0));
        bool saved = false;
        BrightModels.UserSeason storage reviewerSeason = hashUserMap.map[user].seasonData[currentSeasonIndex];
        BrightModels.UserSeason memory userSeason = hashUserMap.map[sender].seasonData[currentSeasonIndex];
        reviewerSeason.toRead.push(url);
        for (uint256 i = 0; i < userSeason.urlSeasonCommits.length; i++){
            if(userSeason.urlSeasonCommits[i] == url){
                saved = true;
                break;
            }
        }
        bool done = false;
        for (i = 0; i < reviewerSeason.pendingReviews.length; i++){
            if(reviewerSeason.pendingReviews[i] == url){
                done = true;
                break;
            }
        }
        if (!done && saved){
            reviewerSeason.pendingReviews.push(url);
            reviewerSeason.allReviews.push(url);
        }
    }

    function removeUserCommit(bytes32 url) public onlyDapp {
        address userHash = tx.origin;
        uint finish;
        uint pending;
        (pending, finish) = root.getNumberOfReviews(url);
        BrightModels.UserProfile storage user = hashUserMap.map[userHash];
        BrightModels.UserSeason storage userSeason = user.seasonData[currentSeasonIndex];
        require(userSeason.seasonCommits[url] && finish == 0);
        for(uint i = 0; i < pending; i++) {
            address reviewerHash = root.getCommitPendingReviewer(url, i);
            BrightModels.UserProfile storage reviewer = hashUserMap.map[reviewerHash];
            UtilsLib.removeFromArray(reviewer.seasonData[currentSeasonIndex].pendingReviews, url);
            UtilsLib.removeFromArray(reviewer.seasonData[currentSeasonIndex].allReviews, url);
            UtilsLib.removeFromArray(reviewer.seasonData[currentSeasonIndex].toRead, url);
        }
        UtilsLib.removeFromArray(userSeason.urlSeasonCommits, url);
        UtilsLib.removeFromArray(allCommitsArray, url);
        root.deleteCommit(url);
        user.globalStats.commitsMade--;
        userSeason.seasonStats.commitsMade--;
        delete userSeason.seasonCommits[url];
        emit DeletedCommit(userHash, url);
    }
    
    function getUserCommits(address userHash) public onlyDapp view returns(bytes32[], bytes32[], bytes32[], bytes32[]) {
        BrightModels.UserSeason memory userSeason = hashUserMap.map[userHash].seasonData[currentSeasonIndex];
        return (userSeason.pendingReviews,
                userSeason.finishedReviews,
                userSeason.urlSeasonCommits,
                userSeason.toRead
        );
    }

    function getUserSeasonState(address userHash, uint256 indSeason) public onlyDapp view returns(uint256, uint256, uint256, uint256, uint256) {
        BrightModels.UserSeason storage userSeason = hashUserMap.map[userHash].seasonData[indSeason];
        return (userSeason.pendingReviews.length,
                userSeason.finishedReviews.length,
                userSeason.urlSeasonCommits.length,
                userSeason.toRead.length,
                userSeason.allReviews.length
        );
    }

    function getUserSeasonCommits(address userHash, uint256 indSeason, uint256 start, uint256 end) public onlyDapp view returns(bytes32[], bytes32[], bytes32[], bytes32[], bytes32[]) {
        BrightModels.UserSeason storage userSeason = hashUserMap.map[userHash].seasonData[indSeason];
        return (UtilsLib.splitArray(userSeason.pendingReviews, start, end),
                UtilsLib.splitArray(userSeason.finishedReviews, start, end),
                UtilsLib.splitArray(userSeason.urlSeasonCommits, start, end),
                UtilsLib.splitArray(userSeason.toRead, start, end),
                UtilsLib.splitArray(userSeason.allReviews, start, end)
        );
    }

    function getNumbers() public onlyDapp view returns(uint){
        return allUsersArray.length;
    }

    function setReview(bytes32 url,address author) public onlyRoot {
        address sender = tx.origin;
        require(hashUserMap.map[author].hash == author && hashUserMap.map[sender].hash == sender);
        checkSeason();
        BrightModels.UserProfile storage user = hashUserMap.map[author];
        BrightModels.UserSeason storage userSeason = user.seasonData[currentSeasonIndex];

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
        emit UserNewReview(sender, reviewer.globalStats.reviewsMade);
    }

    function setUserName(string name) public onlyDapp {
        address userHash = tx.origin;
        hashUserMap.map[userHash].name = name;
    }

    function getUserName(address userHash) public onlyDapp view returns (string) {
        return (hashUserMap.map[userHash].name);
    }

    function getFeedback(bytes32 url) public onlyDapp view returns (bool){
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

    function setSeasonFeedback(address user, uint256 vote) private {
        BrightModels.UserStats storage season = hashUserMap.map[user].seasonData[currentSeasonIndex].seasonStats;
        if(vote == 1){
            season.positeVotes++;
        } else {
            season.negativeVotes++;
        }
        season.agreedPercentage = (season.positeVotes * FEEDBACK_MULTIPLER) / (season.positeVotes + season.negativeVotes);
    }

    function getToRead(address userHash) public onlyDapp view returns (bytes32[]) {
        return (hashUserMap.map[userHash].seasonData[currentSeasonIndex].toRead);
    }

    function getVotes(address userHash, bool global, uint256 indSeason) public onlyDapp view returns (uint, uint) {
        if(global) {
            return (hashUserMap.map[userHash].globalStats.positeVotes, hashUserMap.map[userHash].globalStats.negativeVotes);
        } else {
            return (hashUserMap.map[userHash].seasonData[indSeason].seasonStats.positeVotes, hashUserMap.map[userHash].seasonData[indSeason].seasonStats.negativeVotes);
        }
    }

    function getCurrentSeason() public onlyDapp view returns (uint256, uint256, uint256) {
        uint256 totalTimeSeasons = currentSeasonIndex * seasonLengthSecs;
        uint256 seasonFinaleTime = initialSeasonTimestamp + totalTimeSeasons;
        return (currentSeasonIndex, seasonFinaleTime, seasonLengthSecs);
    }

    function checkSeason() private {
        uint256 seasonFinale = initialSeasonTimestamp + (currentSeasonIndex * seasonLengthSecs);
        if(block.timestamp > seasonFinale) {
            currentSeasonIndex++;
            emit SeasonEnds(currentSeasonIndex);
        }
    }

    function checkCommitSeason(bytes32 url,address author) public onlyDapp view returns (bool) {
        return hashUserMap.map[author].seasonData[currentSeasonIndex].seasonCommits[url];
    }
    
    function setAllUserData(string name, string mail, address hash, uint256 perct, uint256 pos, uint256 neg, uint256 rev, uint256 comMade) public onlyDapp {
        MigrationLib.setAllUserData(allUsersArray, hashUserMap, emailUserMap, deploymentTimestamp, name, mail, hash, perct, pos, neg, rev,comMade);
    }

    function setAllUserSeasonData(uint season, address userAddr, uint percentage, uint posVotes, uint negVotes, uint reputation, uint rev, uint256 comMade, uint complexity) public onlyDapp {
        MigrationLib.setAllUserSeasonData(hashUserMap, season, userAddr, percentage, posVotes, negVotes, reputation, rev, comMade, complexity, deploymentTimestamp);
    }

    function setSeasonUrls(uint256 seasonIndex, address userAddr, bytes32[] urls,  bytes32[] finRev, bytes32[] pendRev, bytes32[] toRd, bytes32[] allRev) public onlyDapp {
        MigrationLib.setSeasonUrls(hashUserMap, deploymentTimestamp, seasonIndex, userAddr, urls, finRev, pendRev, toRd, allRev);
    }
}
