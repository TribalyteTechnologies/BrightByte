pragma solidity 0.4.22;
import "./Root.sol";
import { BrightModels } from "./BrightModels.sol";

library MigrationLib {
    
    uint256 public constant TIME_TO_MIGRATE_SECS = 60 * 60 * 8;

    function getTimeToMigrate() public pure returns (uint256) {
        return TIME_TO_MIGRATE_SECS;
    }

    function setAllUserData(address[] storage allUsersArray, BrightModels.HashUserMap storage hashUserMap, BrightModels.EmailUserMap storage emailUserMap, uint256 deploymentTimestamp, string name, string mail, address hash, uint256 perct, uint256 pos, uint256 neg, uint256 rev, uint256 comMade) public {
        require((TIME_TO_MIGRATE_SECS + deploymentTimestamp) > block.timestamp);
        require (bytes(hashUserMap.map[hash].name).length == 0 && bytes(hashUserMap.map[hash].email).length == 0);
        BrightModels.UserProfile storage user = hashUserMap.map[hash];
        user.name = name;
        user.email = mail;
        user.hash = hash;
        user.globalStats.agreedPercentage = perct;
        user.globalStats.positeVotes = pos;
        user.globalStats.negativeVotes = neg;
        user.globalStats.reviewsMade = rev;
        user.globalStats.commitsMade = comMade;
        bytes32 emailId = keccak256(mail);
        emailUserMap.map[emailId] = hash;
        allUsersArray.push(hash);
    }
    
    function setAllUserSeasonData(BrightModels.HashUserMap storage hashUserMap, uint seasonIndex, address userAddr, uint perct, uint positeVotes, uint negativeVotes, uint reputation, uint rev, uint comMade, uint complexity, uint256 deploymentTimestamp) public {
        require((TIME_TO_MIGRATE_SECS + deploymentTimestamp) > block.timestamp);
        BrightModels.UserProfile storage user = hashUserMap.map[userAddr];
        BrightModels.UserSeason storage season = user.seasonData[seasonIndex];
        season.seasonStats.agreedPercentage = perct;
        season.seasonStats.positeVotes = positeVotes;
        season.seasonStats.negativeVotes = negativeVotes;
        season.seasonStats.reputation = reputation;
        season.seasonStats.reviewsMade = rev;
        season.seasonStats.commitsMade = comMade;
        season.seasonStats.cumulativeComplexity = complexity;
    }
    
    function setSeasonUrls(BrightModels.HashUserMap storage hashUserMap, uint256 deploymentTimestamp, uint256 seasonIndex, address userAddr, bytes32[] urls, bytes32[] finRev, bytes32[] pendRev, bytes32[] toRd, bytes32[] allRev) public {
        require((TIME_TO_MIGRATE_SECS + deploymentTimestamp) > block.timestamp);
        BrightModels.UserProfile storage user = hashUserMap.map[userAddr];
        BrightModels.UserSeason storage season = user.seasonData[seasonIndex];
        for(uint256 i = 0; i < urls.length; i++) {
            season.seasonCommits[urls[i]] = true;
            season.urlSeasonCommits.push(urls[i]);
        }
        for(uint256 x = 0; x < finRev.length; x++) {
            season.finishedReviews.push(finRev[x]);
        }
        for(uint256 y = 0; y < pendRev.length; y++) {
            season.pendingReviews.push(pendRev[y]);
        }
        for(uint256 m = 0; m < toRd.length; m++) {
            season.toRead.push(toRd[m]);
        }
        for(uint256 w = 0; w < allRev.length; w++) {
            season.allReviews.push(allRev[w]);
        }
    }
}
