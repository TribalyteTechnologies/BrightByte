pragma solidity 0.4.21;
import "./Root.sol";

import { MigrationLib } from "./MigrationLib.sol";
import { BrightModels } from "./BrightModels.sol";

contract Bright {
    uint8 private constant FEEDBACK_MULTIPLER = 100;
    uint24 private constant SEASON_LENGTH_SECS = 90 * 24 * 60 * 60;
    uint32 private constant MIGRATION_END_TIMESTAMP = 1557857697;
    Root private root;
    uint16 private currentSeasonIndex;
    uint256 private initialSeasonTimestamp;
    BrightModels.HashUserMap private hashUserMap;
    BrightModels.EmailUserMap private emailUserMap;
    address[] private allUsersArray;

    address private rootAddress;
    address private owner;
    
    event UserProfileSetEvent (string name, address hash);
    event UserNewCommit (address userHash, uint256 numberOfCommits);
    event UserNewReview (address userHash, uint256 numberOfReviews);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SeasonEnds (uint256 currentSeason);

    function Bright() public {
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

    function init(address _root, uint16 seasonIndex, uint256 initialTimestamp) public {
        require(rootAddress == uint80(0));
        root = Root(_root);
        rootAddress = _root;
        currentSeasonIndex = seasonIndex;
        initialSeasonTimestamp = initialTimestamp;
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

    function getAddressByEmail(bytes32 email) public onlyDapp view returns(address){
        address a = emailUserMap.map[email];
        return a;
    }

    function getUser (address userHash) public onlyDapp view returns (string, string, uint, uint, uint, uint32, uint16) {
        BrightModels.UserProfile memory user = hashUserMap.map[userHash];
        return (user.name,
            user.email,
            user.finishedReviews.length,
            user.pendingReviews.length,
            user.pendingCommits.length,
            user.globalStats.reputation,
            user.globalStats.agreedPercentage
        );
    }

    function getUserReputation(address userHash, uint16 seasonIndex) public onlyDapp view returns(string, uint32, uint16, string, uint16, uint, uint16, address) {
        BrightModels.UserProfile memory user = hashUserMap.map[userHash];
        BrightModels.UserSeason memory season = hashUserMap.map[userHash].seasonData[seasonIndex];
        return(user.email,
            season.seasonStats.reputation,
            season.seasonStats.numberOfTimesReview,
            user.name,
            season.seasonStats.agreedPercentage,
            season.urlSeasonCommits.length,
            season.seasonStats.reviewsMade,
            user.hash
        );
    }

    function getAllUserReputation(address userHash) public onlyDapp view returns(string, uint32, uint16, string, uint16, uint, uint, address) {
        BrightModels.UserProfile memory user = hashUserMap.map[userHash];
        return (user.email,
                user.globalStats.reputation,
                user.globalStats.numberOfTimesReview,
                user.name,
                user.globalStats.agreedPercentage,
                user.pendingCommits.length,
                user.finishedReviews.length,
                user.hash
        );
    }

    function setCommit(bytes32 url) public onlyRoot {
        address sender = tx.origin;
        bool saved = false;
        for (uint16 i = 0; i < hashUserMap.map[sender].pendingCommits.length; i++){
            if(hashUserMap.map[sender].pendingCommits[i] == url){
                saved = true;
                break;
            }
        }
        if(!saved){
            BrightModels.UserProfile storage user = hashUserMap.map[sender];
            user.pendingCommits.push(url);
            checkSeason();
            user.seasonData[currentSeasonIndex].urlSeasonCommits.push(url);
            user.seasonData[currentSeasonIndex].seasonCommits[url] = true;
            emit UserNewCommit(sender, user.pendingCommits.length);
        }
    }

    function notifyCommit (string a, bytes32 email) public onlyRoot {
        bytes32 url = keccak256(a);
        address sender = tx.origin;
        address user = getAddressByEmail(email);
        require(user != address(0));
        bool saved = false;
        hashUserMap.map[user].toRead.push(url);
        for (uint16 i = 0; i < hashUserMap.map[sender].pendingCommits.length; i++){
            if(hashUserMap.map[sender].pendingCommits[i] == url){
                saved = true;
                break;
            }
        }
        bool done = false;
        for (i = 0; i < hashUserMap.map[user].pendingReviews.length; i++){
            if(hashUserMap.map[user].pendingReviews[i] == url){
                done = true;
                break;
            }
        }
        if (!done && saved){
            hashUserMap.map[user].pendingReviews.push(url);
        }
    }

    function getUserCommits(address userHash) public onlyDapp view returns(bytes32[], bytes32[], bytes32[]){
        BrightModels.UserProfile memory user = hashUserMap.map[userHash];
        return (user.pendingReviews,
                user.finishedReviews,
                user.pendingCommits
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

        user.globalStats.numberOfTimesReview ++;
        
        BrightModels.UserProfile storage reviewer = hashUserMap.map[sender];
        for (uint8 j = 0 ; j < reviewer.pendingReviews.length; j++){
            if (url == reviewer.pendingReviews[j]){
                reviewer.pendingReviews[j] = reviewer.pendingReviews[reviewer.pendingReviews.length-1];
                reviewer.pendingReviews.length--;
                break;
            }
        }
        hashUserMap.map[sender].finishedReviews.push(url);
        if(userSeason.seasonCommits[url]) {
            userSeason.seasonStats.numberOfTimesReview++;
            (userSeason.seasonStats.reputation, userSeason.seasonStats.cumulativeComplexity) = root.calculateUserReputation(url, userSeason.seasonStats.reputation, userSeason.seasonStats.cumulativeComplexity);
            reviewer.seasonData[currentSeasonIndex].seasonStats.reviewsMade++;
        }
        emit UserNewReview(sender, reviewer.finishedReviews.length);
    }

    function getUserName(address userHash) public onlyDapp view returns (string) {
        return (hashUserMap.map[userHash].name);
    }

    function getFeedback(bytes32 url) public onlyDapp view returns (bool){
        address sender = tx.origin;
        bool read = false;
        for (uint i = 0; i<hashUserMap.map[sender].toRead.length; i++){
            if(hashUserMap.map[sender].toRead[i] == url){
                read = true;
            }
        }
        return read;
    }

    function setFeedback(bytes32 url, address user, bool value, uint8 vote) public onlyRoot{
        address sender = user;
        address maker = tx.origin;
        BrightModels.UserProfile storage userMap = hashUserMap.map[sender];
        checkSeason();
        if(value){
            hashUserMap.map[maker].seasonData[currentSeasonIndex].seasonCommits[url];
            userMap.toRead.push(url);
            if(vote == 1) {
                userMap.globalStats.positeVotes++;
            }
            else if (vote == 2){
                userMap.globalStats.negativeVotes++;
            }
            userMap.globalStats.agreedPercentage = (userMap.globalStats.positeVotes * FEEDBACK_MULTIPLER) / (userMap.globalStats.positeVotes + userMap.globalStats.negativeVotes);
            if(hashUserMap.map[maker].seasonData[currentSeasonIndex].seasonCommits[url]) {
                setSeasonFeedback(user, vote);
            }
        }
        else{
            for (uint16 i = 0 ; i < userMap.toRead.length; i++){
                if (url == userMap.toRead[i]){
                    userMap.toRead[i] = userMap.toRead[userMap.toRead.length - 1];
                    userMap.toRead.length--;
                    break;
                }
            }
        }
    }

    function setSeasonFeedback(address user, uint8 vote) private {
        BrightModels.UserStats storage season = hashUserMap.map[user].seasonData[currentSeasonIndex].seasonStats;
        if(vote == 1){
            season.positeVotes++;
        } else {
            season.negativeVotes++;
        }
        season.agreedPercentage = (season.positeVotes * FEEDBACK_MULTIPLER) / (season.positeVotes + season.negativeVotes);
    }

    function getToRead(address userHash) public onlyDapp view returns (bytes32[]) {
        return (hashUserMap.map[userHash].toRead);
    }

    function getVotes(address userHash, bool global, uint16 indSeason) public onlyDapp view returns (uint, uint) {
        if(global) {
            return (hashUserMap.map[userHash].globalStats.positeVotes, hashUserMap.map[userHash].globalStats.negativeVotes);
        } else {
            return (hashUserMap.map[userHash].seasonData[indSeason].seasonStats.positeVotes, hashUserMap.map[userHash].seasonData[indSeason].seasonStats.negativeVotes);
        }
    }

    function getCurrentSeason() public onlyDapp view returns (uint16, uint256) {
        return (currentSeasonIndex, (initialSeasonTimestamp + (currentSeasonIndex * SEASON_LENGTH_SECS)));
    }

    function getAllUserSeasonUrls(uint16 seasonIndex, address userAddr) public onlyDapp view returns (bytes32[]) {
        BrightModels.UserSeason memory season = hashUserMap.map[userAddr].seasonData[seasonIndex];
        return season.urlSeasonCommits;
    }

    function checkSeason() private {
        uint256 seasonFinale = initialSeasonTimestamp + (currentSeasonIndex * SEASON_LENGTH_SECS);
        if(block.timestamp > seasonFinale) {
            currentSeasonIndex++;
            emit SeasonEnds(currentSeasonIndex);
        }
    }
    function checkCommitSeason(bytes32 url,address author) public onlyRoot view returns (bool) {
        return hashUserMap.map[author].seasonData[currentSeasonIndex].seasonCommits[url];
    }
    
    function setAllUserData(string name, string mail, address hash, uint16 perct, uint16 tmRw, uint16 pos, uint16 neg, uint32 rep, uint16 rev) public onlyDapp {
        MigrationLib.setAllUserData(allUsersArray, hashUserMap, emailUserMap, MIGRATION_END_TIMESTAMP, name, mail,hash, perct, tmRw, pos, neg, rep, rev);
    }

    function setAllUserSeasonData(uint8 sea, address userAddr, uint16 perct, uint16 tmRw, uint16 pos, uint16 neg, uint32 rep, uint16 rev) public onlyDapp {
        MigrationLib.setAllUserSeasonData(hashUserMap, sea, userAddr, perct, tmRw, pos, neg, rep, rev);
    }

    function setAllUserDataTwo(address h, bytes32[] pendCom,  bytes32[] finRev, bytes32[] pendRev, bytes32[] toRd) public onlyDapp { 
        MigrationLib.setAllUserDataTwo(hashUserMap, MIGRATION_END_TIMESTAMP, h, pendCom,  finRev, pendRev, toRd);
    }

    function setUrlsSeason(uint16 seasonIndex, address userAddr, bytes32[] urls) public onlyDapp {
        MigrationLib.setUrlsSeason(hashUserMap, MIGRATION_END_TIMESTAMP, seasonIndex, userAddr, urls);
    }
}
